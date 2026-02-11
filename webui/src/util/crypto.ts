interface PasswordPayload {
  hash: number[];
  timestamp: number;
}

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

export const encryptText = async (
  text: string,
  password: string,
): Promise<Blob> => {
  const arrayBuffer = new TextEncoder().encode(text).buffer;
  return encryptData(arrayBuffer, password);
};

export const encryptFile = async (
  file: File,
  password: string,
): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  return encryptData(arrayBuffer, password);
};

export const encryptData = async (
  data: ArrayBuffer,
  password: string,
): Promise<Blob> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
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
    ["encrypt"],
  );
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  const totalLength =
    salt.byteLength + iv.byteLength + encryptedBuffer.byteLength;
  const combined = new Uint8Array(totalLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
  return new Blob([combined], { type: "application/octet-stream" });
};

export const preparePassword = async (
  password: string,
): Promise<ArrayBuffer> => {
  const passwordPayload = await preparePasswordPayload(password);
  const publicKey = await importPublicKey();
  return crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    new TextEncoder().encode(JSON.stringify(passwordPayload)),
  );
};

const preparePasswordPayload = async (
  password: string,
): Promise<PasswordPayload> => {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    hash: hashArray,
    timestamp,
  };
  return payload;
};

const importPublicKey = async (): Promise<CryptoKey> => {
  const pemKey = await fetch("/api/publickey").then((res) => res.text());
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pem = pemKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\n/g, "");
  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
};
