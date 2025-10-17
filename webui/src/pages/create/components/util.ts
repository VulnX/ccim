import { preparePassword } from "../../../util/crypto";

interface ApiResponse {
  message: string;
}

export interface DialogDetails {
  success: boolean;
  message: string;
}

interface Info {
  name: string;
  expire_after: number;
  passwd_hash?: number[];
}

export const createClipboard = async (
  setProgress: React.Dispatch<React.SetStateAction<number | null>>,
  name: string,
  text: string,
  fileList: File[],
  expire_after: number,
  isEncrypted: boolean,
  password: string,
) => {
  const formData = new FormData();

  // Allow creation of empty encrypted text, so that frontend can attempt to
  // decrypt it and verify password.
  formData.append("text", isEncrypted ? await encrypt(text, password) : text);
  const encryptionPromises = fileList.map(async (file) => {
    formData.append(
      "file",
      isEncrypted ? await encrypt(file, password) : file,
      file.name,
    );
  });
  await Promise.all(encryptionPromises);
  const info: Info = {
    name,
    expire_after,
  };
  if (isEncrypted) {
    let passwd_hash = await preparePassword(password);
    info["passwd_hash"] = Array.from(new Uint8Array(passwd_hash));
  }
  formData.append("info", JSON.stringify(info));

  // Submit form
  let details: DialogDetails = {
    success: false,
    message: "Unknown error occured",
  };
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/clipboards");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        setProgress(percentage);
      }
    };

    const response = await new Promise<XMLHttpRequest>((resolve, reject) => {
      xhr.onload = () => resolve(xhr);
      xhr.onerror = () => reject(new Error("XHR request failed"));
      xhr.send(formData);
    });

    if (response.status !== 201) {
      try {
        const parsed: ApiResponse = JSON.parse(response.responseText);
        details.message = parsed.message;
      } catch {
        details.message = "An unexpected error occurred";
      }
    } else {
      details.message = `Congrats! Clipboard '${name}' has been created`;
    }
    details.success = response.status === 201;
  } catch (error) {
    details.message = "Failed to communicate with the server";
  } finally {
    return details;
  }
};

const encrypt = async (
  data: string | File,
  password: string,
): Promise<Blob> => {
  let arrayBuffer: ArrayBuffer;
  if (typeof data === "string") {
    arrayBuffer = new TextEncoder().encode(data).buffer;
  } else if (data instanceof File) {
    arrayBuffer = await data.arrayBuffer();
  } else {
    throw new Error("Unsupported data type");
  }
  return encryptData(arrayBuffer, password);
};

const encryptData = async (
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
