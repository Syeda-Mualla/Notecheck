import type { PickedFile } from './picker'

// Enumerate only explicitly selected folders, including their subfolders.
// Fail closed on partial listings; never silently report an incomplete folder.
export async function expandFolders(accessToken: string, selected: PickedFile[]): Promise<PickedFile[]> {
  const folderMime = 'application/vnd.google-apps.folder'
  const queue = selected.filter(file => file.mimeType === folderMime)
  const files = new Map(selected.filter(file => file.mimeType !== folderMime).map(file => [file.id, file]))
  const visited = new Set<string>()
  if (files.size > 100) throw new Error('Choose at most 100 files per check.')
  for (let index = 0; index < queue.length; index++) {
    const folder = queue[index]
    if (visited.has(folder.id)) continue
    visited.add(folder.id)
    if (visited.size > 100) throw new Error('This selection contains too many subfolders. Choose a smaller folder.')
    let pageToken = ''
    const seenPages = new Set<string>()
    do {
      const escapedId = folder.id.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      const params = new URLSearchParams({
        q: `'${escapedId}' in parents and trashed = false`,
        fields: 'nextPageToken,incompleteSearch,files(id,name,mimeType)',
        pageSize: '100', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
      })
      if (pageToken) params.set('pageToken', pageToken)
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new Error(response.status === 401
        ? 'Google access expired. Choose the folder again to reconnect.'
        : `Could not read folder "${folder.name}" (${response.status}). Try again or choose Docs directly.`)
      const data = await response.json()
      if (data.incompleteSearch || !Array.isArray(data.files)) throw new Error('Google returned an incomplete folder listing. Choose Docs directly or try again.')
      for (const file of data.files) {
        if (typeof file.id !== 'string' || typeof file.name !== 'string' || typeof file.mimeType !== 'string') throw new Error('Google returned an invalid file listing. Try again.')
        if (file.mimeType === folderMime) queue.push(file)
        else files.set(file.id, file)
        if (files.size > 100) throw new Error('This folder selection contains more than 100 files. Choose a smaller folder or select Docs directly.')
      }
      pageToken = data.nextPageToken || ''
      if (pageToken && seenPages.has(pageToken)) throw new Error('Google returned an incomplete folder listing. Try again.')
      seenPages.add(pageToken)
    } while (pageToken)
  }
  if (!files.size) throw new Error('No files found in the selected folders. Choose another folder or select Docs directly.')
  return [...files.values()].sort((a, b) => a.name.localeCompare(b.name))
}
