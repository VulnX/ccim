interface ApiResponse {
  message: string;
}

export interface DialogDetails {
  success: boolean;
  message: string;
}

export const createClipboard = async (
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
    const response = await fetch("/api/clipboards", {
      method: "POST",
      body: formData,
    });
    if (response.status !== 201) {
      // If error
      const text = await response.text();
      const parsed: ApiResponse = JSON.parse(text);
      details.message = parsed.message;
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
