import { WebView, useEffect, useMemo } from 'scripting'

export default function Detail({ url }: { url: string }) {
  const controller = useMemo(() => new WebViewController(), [])

  useEffect(() => {
    controller.loadURL(url)
  }, [])

  return (
    <WebView
      navigationBarTitleDisplayMode='inline'
      frame={{ maxHeight: 'infinity' }}
      controller={controller}
    />
  )
}
