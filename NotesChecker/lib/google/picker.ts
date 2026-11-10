import { loadScript } from './loadScript'

declare global {
  interface Window {
    gapi?: any
    google?: any
  }
}

export type PickedFile = { id: string; name: string; mimeType: string }

let pickerLoaded = false

async function ensurePickerLoaded(): Promise<void> {
  if (pickerLoaded) return
  await loadScript('https://apis.google.com/js/api.js')
  await new Promise<void>((resolve) => {
    window.gapi!.load('picker', () => resolve())
  })
  pickerLoaded = true
}

// Docs and folder selection are separate so folder-wide consent is explicit.
export async function openDocPicker(accessToken: string, mode: 'docs' | 'folder' = 'docs'): Promise<PickedFile[]> {
  await ensurePickerLoaded()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_API_KEY is not set in .env.local')
  }

  // Required for the drive.file scope: without this, Picker will show and
  // let the user pick a file, but the app is never actually granted read
  // access to it - reads then fail with a 403.
  const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID
  if (!appId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_APP_ID is not set in .env.local (this is your Cloud project number, not the Client ID).')
  }

  return new Promise((resolve, reject) => {
    const view = new window.google!.picker.DocsView(mode === 'folder' ? window.google!.picker.ViewId.FOLDERS : window.google!.picker.ViewId.DOCUMENTS)
      .setMimeTypes(mode === 'folder' ? 'application/vnd.google-apps.folder' : 'application/vnd.google-apps.document')
      .setIncludeFolders(mode === 'folder')
      .setSelectFolderEnabled(mode === 'folder')
      .setMode(window.google!.picker.DocsViewMode.LIST)

    const picker = new window.google!.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setAppId(appId)
      .enableFeature(window.google!.picker.Feature.MULTISELECT_ENABLED)
      .setCallback((data: any) => {
        if (data.action === window.google!.picker.Action.PICKED) {
          const files: PickedFile[] = data.docs.map((d: any) => ({ id: d.id, name: d.name, mimeType: d.mimeType }))
          resolve(files)
        } else if (data.action === window.google!.picker.Action.CANCEL) {
          reject(new Error('cancelled'))
        }
      })
      .build()

    picker.setVisible(true)
  })
}
