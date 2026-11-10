const loaded = new Set<string>()

export function loadScript(src: string): Promise<void> {
  if (loaded.has(src)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => {
      loaded.add(src)
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}
