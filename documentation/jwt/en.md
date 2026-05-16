The `JWT` class provides synchronous APIs to sign, verify, and decode JSON Web Tokens.

---

## Constructor

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

### Parameters

| Name       | Type             | Required | Description |
| ---------- | ---------------- | -------- | ----------- |
| algorithm  | JWTAlgorithm     | No       | Default signing algorithm. Defaults to `HS256`. |
| secret     | string \| Data   | No       | Shared secret used by `HS256` / `HS384` / `HS512`. |
| privateKey | string \| Data   | No       | Private key used by `RS*` / `PS*` / `ES*` / `EdDSA` signing. |
| publicKey  | string \| Data   | No       | Public key used by `RS*` / `PS*` / `ES*` / `EdDSA` verification. |
| passphrase | string           | No       | Optional passphrase field for key workflows. |
| kid        | string           | No       | Optional key ID written into JWT header. |

### Supported Algorithms

* HMAC: `HS256`, `HS384`, `HS512`
* RSA PKCS#1 v1.5: `RS256`, `RS384`, `RS512`
* RSA-PSS: `PS256`, `PS384`, `PS512`
* ECDSA: `ES256`, `ES384`, `ES512`
* EdDSA: `EdDSA` (Ed25519)

---

## Methods

### `sign(payload, options?): string`

Creates a JWT string synchronously.

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

Verifies signature and standard claims synchronously. Throws on failure.

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

Decodes JWT without signature verification.

```ts
decode(token: string): {
  header: Record<string, any>
  payload: Record<string, any>
  signature: string
  signingInput: string
}
```

---

## Example

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

## Error Handling

All methods are synchronous. If validation or cryptographic operations fail, `JWT` throws an `Error`.
