import { Box, Button, Tab, Tabs, TextField } from "@mui/material";
import React, { useState } from "react";

const AddDataStep: React.FC = () => {
  const [value, setValue] = React.useState("text");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileList, setFileList] = useState<Array<File>>([]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFilePicker = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const existingFileKeys = new Set(
      fileList.map((file) => file.name + file.size + file.lastModified)
    );
    const newFiles: File[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const fileKey = file.name + file.size + file.lastModified;
      if (!existingFileKeys.has(fileKey)) {
        newFiles.push(file);
      }
    });

    const updatedFileList = [...fileList, ...newFiles];
    setFileList(updatedFileList);
  };

  return (
    <>
      <Tabs value={value} onChange={handleTabChange}>
        <Tab value="text" label="Text" />
        <Tab value="files" label="Files" />
      </Tabs>

      <Box sx={{ marginTop: 2 }}>
        {value === "text" && (
          <TextField label="Paste text here" fullWidth multiline />
        )}

        {value === "files" && (
          <>
            <input
              type="file"
              ref={inputRef}
              hidden
              onChange={handleFilePicker}
            />
            <Button variant="outlined" fullWidth onClick={handleButtonClick}>
              Select files
            </Button>
            {fileList.map((file) => {
              return <p>{file.name}</p>;
            })}
          </>
        )}
      </Box>
    </>
  );
};

export default AddDataStep;
