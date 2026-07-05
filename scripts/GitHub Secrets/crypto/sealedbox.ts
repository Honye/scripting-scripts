import nacl from '../vendor/tweetnacl'
import blake2bModule from '../vendor/blake2b'

// blake2b(input, key?, outlen?) -> digest. The vendored file is `@ts-nocheck`,
// so give the imported function a precise signature for our call site.
const blake2b = blake2bModule as (
  input: Uint8Array,
  key?: Uint8Array,
  outlen?: number
) => Uint8Array

// The host `Crypto` module (not the DOM `Crypto`) provides random-key generation.
const HostCrypto = Crypto as unknown as {
  generateSymmetricKey(bits: number): Data
}

// tweetnacl needs a CSPRNG. The Scripting runtime provides none of the
// browser/Node sources tweetnacl probes for, so inject one backed by the
// host `Crypto` module. Must be set before any keyPair()/box() call.
let prngReady = false
function ensurePRNG() {
  if (prngReady) return
  nacl.setPRNG((x: Uint8Array, n: number) => {
    const bytes = HostCrypto.generateSymmetricKey(n * 8).toUint8Array()
    if (!bytes || bytes.length < n) {
      throw new Error('Failed to generate secure random bytes')
    }
    for (let i = 0; i < n; i++) x[i] = bytes[i]
  })
  prngReady = true
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b, a.length)
  return out
}

/**
 * Encrypt a value with a repository's public key using libsodium's
 * `crypto_box_seal` (X25519 ephemeral key + XSalsa20-Poly1305, nonce =
 * BLAKE2b-192 of `ephemeral_pk || recipient_pk`). Returns the base64 string
 * GitHub expects for the `encrypted_value` field.
 */
export function sealBox(recipientPublicKeyBase64: string, message: string): string {
  ensurePRNG()

  const pk = Data.fromBase64String(recipientPublicKeyBase64)?.toUint8Array()
  if (!pk || pk.length !== 32) {
    throw new Error('Invalid repository public key')
  }
  const msg = Data.fromRawString(message)?.toUint8Array() ?? new Uint8Array(0)

  const ephemeral = nacl.box.keyPair()
  const nonce = blake2b(concat(ephemeral.publicKey, pk), undefined, 24)
  const boxed = nacl.box(msg, nonce, pk, ephemeral.secretKey)
  const sealed = concat(ephemeral.publicKey, boxed)

  return Data.fromUint8Array(sealed)!.toBase64String()
}
