流式脚本**逐帧**处理响应, 而非缓冲整个响应体。把[抓包规则](capture_scripts/zh.md)设为 **Response** 类型, 在规则的 **Streaming** 段选一个 **Frame Codec**。脚本随后每帧执行一次, 内存占用极小, 且无需等响应结束即可开始输出。

流式仅适用于**有帧边界**的格式。首个 codec 是 **SSE**(`text/event-stream`, 仅 identity 编码)。单体 JSON 这类需要完整文档才能解析的格式无法流式, 继续走缓冲模型。

---

## 模式

* **Modify(改写)** —— 内联改写。每帧执行脚本并把结果重新发出, 脚本可改写、丢弃或注入帧。转发会等待脚本(天然背压)。
* **Observe(观察)** —— 旁路 tee。原始流原样转发, 另把一份副本交给脚本只做副作用(日志、`$notification`)。返回值被忽略, 脚本绝不拖慢流。Observe 为逐帧无状态快照; 需要 `$streamState` 时请用 Modify。

---

## 全局对象

```ts
// 当前帧。
$frame: {
  data: string       // SSE: 拼接后的 `data:` 正文
  event?: string     // SSE: `event:` 名(如有)
  id?: string        // SSE: `id:` 字段(如有)
  index: number      // 本流内从 0 起的帧序号
  isFirst: boolean
  isLast: boolean    // 仅在收尾的合成空帧上为 true(flush 信号)
}

// 同一响应所有帧共享的按流对象。
// 修改会保留到下一帧(仅 Modify 模式)。存于内存, 不落盘。
// 上限 256 KB; 超限则本流余下帧直通。
$streamState: object
```

其余抓包脚本全局对象同样可用:`$argument`、`$persistentStore`、`$httpClient`、`$notification`、`$utils`、`console`。

---

## $done 结果

```js
$done()                        // 原样直通本帧(快路径)
$done({ data })                // 替换本帧 data(保留原 event/id)
$done({ data, event, id })     // 替换 data 及 event/id 字段
$done({ drop: true })          // 丢弃本帧(不发)
$done({ inject: [ { data, event?, id? }, ... ] })   // 保留本帧, 再追加若干帧
$done({ data, inject: [ ... ] })                    // 替换后再注入
```

---

## 示例

```js
// Modify: 逐个 SSE event 流式打码 token。
const text = $frame.data.replace(/secret-token-\d+/g, "***")
$done(text === $frame.data ? undefined : { data: text })
```

```js
// Modify: 跨帧累积, 结束时输出一条汇总。
const s = $streamState
if (!s.lines) s.lines = []
if ($frame.isLast) {
  $done({ data: "SUMMARY: " + s.lines.join(" | ") })
} else {
  s.lines.push($frame.data)
  $done({ drop: true })
}
```

```js
// Observe: 只告警, 不改流。
if (/secret/i.test($frame.data)) {
  $notification.post("Stream alert", "", $frame.data)
}
$done()
```

---

## 说明

* `isLast` 在最后一个真实帧之后, 以一个合成空帧投递; 用它来 flush 累积的 `$streamState`。
* SSE 输出按规范形式重新序列化, 不保留未知字段与原始空白。
* 带 `Content-Encoding`(gzip/br)的响应回落到非流式的仅头处理。
