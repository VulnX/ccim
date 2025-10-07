// Decrypt the clipboard's text
export const decryptText = async (
  encryptedData: Uint8Array,
  password: string
): Promise<string> => {
  const salt = encryptedData.slice(0, 16); // First 16 bytes are the salt
  const iv = encryptedData.slice(16, 28); // Next 12 bytes are the IV
  const ciphertext = encryptedData.slice(28); // The rest is the encrypted data

  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error("Decryption failed");
  }
};
