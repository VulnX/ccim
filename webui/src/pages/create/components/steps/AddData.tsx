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
import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { Article, Upload } from "@mui/icons-material";

type AddDataProps = {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  fileList: File[];
  setFileList: React.Dispatch<React.SetStateAction<File[]>>;
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
};

const AddDataStep: React.FC<AddDataProps> = ({
  text,
  setText,
  fileList,
  setFileList,
  currentTab,
  setCurrentTab,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
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

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = Math.max(0, decimals);
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    return `${size} ${sizes[i]}`;
  };

  return (
    <>
      <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
        <Tab
          value="text"
          label="Text"
          icon={<Article fontSize="small" />}
          iconPosition="start"
        />
        <Tab
          value="files"
          label="Files"
          icon={<Upload fontSize="small" />}
          iconPosition="start"
        />
      </Tabs>

      <Box sx={{ marginTop: 2 }}>
        {currentTab === "text" && (
          <TextField
            label="Paste text here"
            fullWidth
            multiline
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        {currentTab === "files" && (
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
                      secondary={formatBytes(file.size)}
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
