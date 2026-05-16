`JWT` 类提供同步 API，用于签发、验证和解码 JSON Web Token。

---

## 构造函数

```ts
new JWT(options?: {
  algorithm?: JWTAlgorithm
  secret?: string | Data
  privateKey?: string | Data
  publicKey?: string | Data
  passphrase?: string
  kid?: string
})
```

### 参数说明

| 参数名       | 类型             | 是否必填 | 说明 |
| ---------- | ---------------- | ---- | ---- |
| algorithm  | JWTAlgorithm     | 否   | 默认签名算法，默认值为 `HS256`。 |
| secret     | string \| Data   | 否   | `HS256` / `HS384` / `HS512` 使用的共享密钥。 |
| privateKey | string \| Data   | 否   | `RS*` / `PS*` / `ES*` / `EdDSA` 签名使用的私钥。 |
| publicKey  | string \| Data   | 否   | `RS*` / `PS*` / `ES*` / `EdDSA` 验签使用的公钥。 |
| passphrase | string           | 否   | 密钥流程的可选口令字段。 |
| kid        | string           | 否   | 可选 Key ID，会写入 JWT Header 的 `kid` 字段。 |

### 支持的算法

* HMAC: `HS256`, `HS384`, `HS512`
* RSA PKCS#1 v1.5: `RS256`, `RS384`, `RS512`
* RSA-PSS: `PS256`, `PS384`, `PS512`
* ECDSA: `ES256`, `ES384`, `ES512`
* EdDSA: `EdDSA`（Ed25519）

---

## 方法

### `sign(payload, options?): string`

同步生成 JWT 字符串。

```ts
sign(payload: Record<string, any>, options?: {
  algorithm?: JWTAlgorithm
  header?: Record<string, any>
  issuer?: string
  subject?: string
  audience?: string | string[]
  jwtId?: string
  nonce?: string
  notBefore?: number | string
  expiresIn?: number | string
  issuedAt?: number | string
  kid?: string
}): string
```

### `verify(token, options?): { header; payload }`

同步验证签名和标准声明，失败会抛异常。

```ts
verify(token: string, options?: {
  algorithm?: JWTAlgorithm | JWTAlgorithm[]
  issuer?: string | string[]
  subject?: string
  audience?: string | string[]
  jwtId?: string
  nonce?: string
  clockTolerance?: number
  currentDate?: number | Date
}): {
  header: Record<string, any>
  payload: Record<string, any>
}
```

### `decode(token): { header; payload; signature; signingInput }`

仅解码，不验证签名。

```ts
decode(token: string): {
  header: Record<string, any>
  payload: Record<string, any>
  signature: string
  signingInput: string
}
```

---

## 示例

```ts
const jwt = new JWT({
  algorithm: "HS256",
  secret: "my-secret",
  kid: "k1"
})

const token = jwt.sign(
  { userId: "u_123", role: "admin" },
  {
    issuer: "Scripting",
    audience: ["app", "web"],
    expiresIn: 3600
  }
)

const verified = jwt.verify(token, {
  issuer: "Scripting",
  audience: "app",
  algorithm: "HS256"
})

console.log(verified.header.alg)
console.log(verified.payload.userId)
```

---

## 错误处理

所有方法均为同步调用。参数校验失败、声明校验失败或加解密失败时，`JWT` 会抛出 `Error`。
