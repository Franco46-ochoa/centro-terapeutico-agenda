/**
 * Módulo de Cifrado Criptográfico en el Cliente (WebCrypto API)
 * - Algoritmo: AES-GCM 256 bits
 * - Derivación de clave: PBKDF2-HMAC-SHA256 con 600.000 iteraciones (recomendación OWASP)
 * - Garantiza que los backups (.enc.json) y la caché en PC nunca persistan en texto plano.
 */

export interface EncryptedEnvelope {
  cipher: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  saltBase64: string;
  ivBase64: string;
  ciphertextBase64: string;
}

const PBKDF2_ITERATIONS = 600_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesGcmKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJsonWithPassphrase(
  payload: unknown,
  passphrase: string
): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesGcmKey(passphrase, salt, PBKDF2_ITERATIONS);

  const plaintextBytes = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    plaintextBytes
  );

  const envelope: EncryptedEnvelope = {
    cipher: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    saltBase64: bytesToBase64(salt),
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(encryptedBuffer)),
  };

  return JSON.stringify(envelope, null, 2);
}

export async function decryptJsonWithPassphrase(
  encryptedContent: string,
  passphrase: string
): Promise<unknown> {
  const envelope = JSON.parse(encryptedContent) as EncryptedEnvelope;
  if (
    envelope.cipher !== 'AES-GCM-256' ||
    !envelope.saltBase64 ||
    !envelope.ivBase64 ||
    !envelope.ciphertextBase64
  ) {
    throw new Error('Formato de archivo cifrado inválido o corrupto.');
  }

  const salt = base64ToBytes(envelope.saltBase64);
  const iv = base64ToBytes(envelope.ivBase64);
  const ciphertext = base64ToBytes(envelope.ciphertextBase64);

  const key = await deriveAesGcmKey(
    passphrase,
    salt,
    envelope.iterations || PBKDF2_ITERATIONS
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  const jsonText = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(jsonText);
}
