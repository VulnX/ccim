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
import { formatBytes } from "../../../../util/helper";

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

  return (
    <>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="fullWidth"
        textColor="inherit"
        sx={{
          mb: 3,
          "& .MuiTabs-indicator": {
            background: "#1a1a1a",
            height: 3,
          },
          "& .MuiTab-root": {
            fontWeight: 600,
            textTransform: "none",
            fontSize: "0.95rem",
            color: "#666666",
            "& .MuiSvgIcon-root": {
              color: "#666666",
            },
            "&.Mui-selected": {
              color: "#1a1a1a !important",
              "& .MuiSvgIcon-root": {
                color: "#1a1a1a !important",
              },
            },
          },
        }}
      >
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
            label="Content"
            fullWidth
            multiline
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
                background: "#f9f9f9",
                "& fieldset": { borderColor: "#e0e0e0" },
                "&:hover fieldset": { borderColor: "#1a1a1a" },
                "&.Mui-focused fieldset": { borderColor: "#1a1a1a" },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "#1a1a1a" },
            }}
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
            <Button
              variant="outlined"
              fullWidth
              onClick={handleButtonClick}
              startIcon={<Upload />}
              sx={{
                py: 2,
                borderRadius: 1,
                borderStyle: "dashed",
                borderColor: "#e0e0e0",
                color: "#1a1a1a",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": {
                  borderColor: "#1a1a1a",
                  background: "#f9f9f9",
                  borderStyle: "dashed",
                },
              }}
            >
              Select files to share
            </Button>
            <List sx={{ mt: 2 }}>
              {fileList.map((file, idx) => {
                return (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <Tooltip title="Remove file" arrow>
                        <IconButton
                          onClick={() => deleteFile(file)}
                          sx={{
                            color: "#e74c3c",
                            "&:hover": {
                              background: "#fdf2f2",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      background: "white",
                      border: "1px solid #e0e0e0",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#1a1a1a",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        mr: 2,
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        background: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#1a1a1a",
                        flexShrink: 0,
                      }}
                    >
                      <Article fontSize="small" />
                    </Box>
                    <ListItemText
                      primary={file.name}
                      secondary={formatBytes(file.size)}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        color: "#1a1a1a",
                        fontSize: "0.9rem",
                      }}
                      secondaryTypographyProps={{
                        color: "#666666",
                        fontSize: "0.75rem",
                      }}
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
