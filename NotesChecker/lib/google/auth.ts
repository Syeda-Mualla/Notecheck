import { loadScript } from './loadScript'

const FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const FOLDER_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
declare global { interface Window { google?: any } }
let clientId: string | undefined
// Memory only: reload/close clears tokens. Never persist tokens in browser storage.
let grant: { token: string; expiresAt: number; folders: boolean } | null = null

export async function initGoogleAuth(): Promise<void> {
  await loadScript('https://accounts.google.com/gsi/client')
  clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in .env.local')
}

export function requestAccessToken(folderAccess = false): Promise<string> {
  if (grant && Date.now() < grant.expiresAt && (!folderAccess || grant.folders)) return Promise.resolve(grant.token)
  return new Promise((resolve, reject) => {
    if (!clientId) { reject(new Error('Please connect Google first.')); return }
    // Initial connection chooses an account. Additional permission/renewal does
    // not explicitly request another account chooser. Google controls consent.
    const scope = folderAccess ? FOLDER_SCOPE : FILE_SCOPE
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      include_granted_scopes: true,
      prompt: grant ? '' : 'select_account',
      error_callback: () => reject(new Error('Google sign-in was closed or blocked. Please try again.')),
      callback: (response: any) => {
        if (response.error) { reject(new Error('Google access was not granted. Please try again.')); return }
        if (!window.google!.accounts.oauth2.hasGrantedAllScopes(response, scope)) {
          reject(new Error('The requested permission was not granted. You can still choose individual Docs.')); return
        }
        const seconds = Number(response.expires_in)
        if (!response.access_token || !Number.isFinite(seconds) || seconds <= 0) {
          reject(new Error('Google returned an invalid connection. Please try again.')); return
        }
        grant = {
          token: response.access_token,
          expiresAt: Date.now() + Math.max(0, seconds - 60) * 1000,
          folders: window.google!.accounts.oauth2.hasGrantedAllScopes(response, FOLDER_SCOPE),
        }
        resolve(grant.token)
      },
    })
    tokenClient.requestAccessToken()
  })

}
