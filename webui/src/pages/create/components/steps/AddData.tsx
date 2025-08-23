import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Tooltip,
} from "@mui/material";
import React, { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";

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
      fileList.map((file) => file.name + file.size + file.lastModified),
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

  const deleteFile = (fileToDelete: File) => {
    setFileList(fileList.filter((file) => file !== fileToDelete));
  };

  return (
    <>
      <Tabs value={value} onChange={handleTabChange} variant="fullWidth">
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
              multiple
              onChange={handleFilePicker}
            />
            <Button variant="outlined" fullWidth onClick={handleButtonClick}>
              Select files
            </Button>
            <List>
              {fileList.map((file) => {
                return (
                  <ListItem
                    secondaryAction={
                      <Tooltip title="Delete">
                        <IconButton onClick={() => deleteFile(file)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      marginY: 1,
                    }}
                  >
                    <ListItemText
                      primary={file.name}
                      secondary={`${file.size} bytes`}
                      sx={{
                        wordBreak: "break-all",
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Box>
    </>
  );
};

export default AddDataStep;
