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

type AddDataProps = {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  fileList: File[];
  setFileList: React.Dispatch<React.SetStateAction<File[]>>;
};

const AddDataStep: React.FC<AddDataProps> = ({
  text,
  setText,
  fileList,
  setFileList,
}) => {
  const [currentTab, setCurrentTab] = React.useState("text");
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

  return (
    <>
      <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
        <Tab value="text" label="Text" />
        <Tab value="files" label="Files" />
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
