`$utils` 为抓包规则脚本提供一些小工具函数。它仅在[抓包规则脚本](capture_scripts/zh.md)中可用。

---

## `ungzip`

```ts
$utils.ungzip(data: Uint8Array): Uint8Array
```

解压 gzip 数据,以 `Uint8Array` 返回结果。若输入不是合法 gzip,则原样返回原始字节。

当响应声明了 `Content-Encoding: gzip` 时,抓包引擎**已经**替你解压了响应体;因此只有当数据是在**应用层**被 gzip 压缩时(例如某个字段里内嵌了一段 gzip),才需要用 `ungzip`。请在规则上打开 **Binary Body**,让 `body` 以 `Uint8Array` 暴露。

```js
// 响应规则, 打开 Requires Body + Binary Body。
const plain = $utils.ungzip($response.body)   // Uint8Array
const text = new TextDecoder().decode(plain)
console.log(text)
$done({})
```

---

## `geoip` / `ipasn` / `ipaso`

```ts
$utils.geoip(ip: string): string | null
$utils.ipasn(ip: string): string | null
$utils.ipaso(ip: string): string | null
```

这三者分别查询某个 IP 地址的国家(ISO 3166 代码)、自治系统号(ASN)与自治系统组织(ASO)。

> 这些函数目前返回 `null`——未内置 IP 地理位置数据。提供它们只是为了让引用到它们的脚本不至于报错;请把 `null` 结果当作「未知」处理。
