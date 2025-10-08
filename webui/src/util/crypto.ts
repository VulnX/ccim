export const decryptText = async (
  encryptedText: number[],
  password: string,
): Promise<string> => {
  const decryptedData = await decryptData(
    new Uint8Array(encryptedText),
    password,
  );

  // Convert decrypted binary data into a string (assuming it was originally text)
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};

export const decryptData = async (
  encryptedData: Uint8Array,
  password: string,
): Promise<ArrayBuffer> => {
  const salt = encryptedData.slice(0, 16); // First 16 bytes are the salt
  const iv = encryptedData.slice(16, 28); // Next 12 bytes are the IV
  const ciphertext = encryptedData.slice(28); // The rest is the encrypted data

  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
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
    ["decrypt"],
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return decryptedBuffer; // Return raw binary data (Uint8Array)
  } catch (error) {
    throw new Error("Decryption failed");
  }
};
