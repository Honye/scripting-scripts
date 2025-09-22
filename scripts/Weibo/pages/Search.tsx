import { Path, Script, useEffect, useMemo, WebView } from 'scripting'

export default function Search({ url }: { url: string }) {
  const controller = useMemo(() => new WebViewController(), [])

  useEffect(() => {
    (async () => {
      await controller.loadURL(url)
      // 执行 JS 增加 style 样式，修改样式
      const cssPath = Path.join(Script.directory, 'styles/dark.css')
      const css = Data.fromFile(cssPath)?.toRawString() || ''
      controller.evaluateJavaScript(`
        const style = document.createElement('style');
        style.innerHTML = \`
          /** 隐藏相关搜索
          .card.card11 { display: none !important; }
          /** 隐藏底部评论输入 */
          .m-tab-bar.m-bar-panel.m-container-max { display: none !important; }
          ${css}
        \`;
        document.head.appendChild(style);
      `)
      controller.canGoBack()
    })()
  }, [])

  return (
      <WebView
        navigationBarTitleDisplayMode='inline'
        frame={{ maxHeight: 'infinity' }} controller={controller}
      />
  )
}
