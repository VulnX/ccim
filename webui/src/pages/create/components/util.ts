interface ApiResponse {
  message: string;
}

export interface DialogDetails {
  success: boolean;
  message: string;
}

export const createClipboard = async (
  setProgress: React.Dispatch<React.SetStateAction<number | null>>,
  name: string,
  text: string,
  fileList: File[],
  expire_after: number,
  _isEncrypted: boolean,
  _password: string,
) => {
  const formData = new FormData();

  if (0 < text.length) {
    formData.append("text", text);
  }
  fileList.map((file) => formData.append("file", file));
  const info = {
    name,
    expire_after,
  };
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
