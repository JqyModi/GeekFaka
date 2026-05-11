import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

const PREFIX = "enc:v1:"

function getSecretKey() {
  const source = process.env.SUPPLIER_SECRET_KEY
    || process.env.JWT_SECRET
    || process.env.ADMIN_PASSWORD
    || "default-secret-please-change"

  return createHash("sha256").update(source).digest()
}

export function encryptSupplierSecret(value: string | null | undefined) {
  if (!value) return null
  if (value.startsWith(PREFIX)) return value

  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getSecretKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`
}

export function decryptSupplierSecret(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith(PREFIX)) return value

  const payload = Buffer.from(value.slice(PREFIX.length), "base64")
  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(12, 28)
  const encrypted = payload.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", getSecretKey(), iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8")
}

export function maskSupplierSecret(value: string | null | undefined) {
  const decrypted = decryptSupplierSecret(value)
  if (!decrypted) return null
  if (decrypted.length <= 8) return "••••"

  return `${decrypted.slice(0, 4)}••••${decrypted.slice(-4)}`
}

