export const createClipboard = async (
  name: string,
  text: string,
  fileList: File[],
  isEncrypted: boolean,
  password: string
) => {
  const formData = new FormData();

  if (0 < text.length) {
    formData.append("text", text);
  }
  fileList.map((file) => formData.append("file", file));
  const info = {
    name: name,
    expire_after: 300,
  };
  formData.append("info", JSON.stringify(info));
  formData.forEach((value, key) => {
    console.log(`${key} -> ${value}`);
  });

  // Submit form
  try {
    const response = await fetch("http://localhost:8080/api/clipboards", {
      method: "POST",
      body: formData,
    });
    console.log("response:", response);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
