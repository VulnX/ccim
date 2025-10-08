import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatBytes } from "../../util/helper";
import { useClipboard } from "../../context/ClipboardContext";
import { decryptData, decryptText } from "../../util/crypto";

const Clip: React.FC = () => {
  const navigate = useNavigate();
  const { clipboardName } = useParams();
  const { clipboardList, fetchClipboards } = useClipboard()!;
  const clipboard = clipboardList.find((clip) => clip.name === clipboardName);
  if (!clipboard) {
    return <h1>NOT FOUND</h1>;
  }
  const hasRun = React.useRef(false);
  const [name, setName] = React.useState<string | undefined>(undefined);
  const [text, setText] = React.useState<string | undefined>(undefined);
  const [password, setPassword] = React.useState<string | undefined>(undefined);

  const downloadFile = async (fileName: string, fileId: string) => {
    try {
      // Fetch the file's data (encrypted or not) from the server
      const response = await fetch(`/api/clipboards/file/${fileId}`);
      const arrayBuffer = await response.arrayBuffer();

      if (clipboard.is_encrypted) {
        // If the file is encrypted, decrypt it first
        const decryptedData = await decryptData(
          new Uint8Array(arrayBuffer),
          password!,
        );

        const blob = new Blob([decryptedData], {
          type: "application/octet-stream",
        });
        const link = document.createElement("a");
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If the file is not encrypted, download as it is
        const blob = new Blob([arrayBuffer], {
          type: "application/octet-stream",
        });
        const link = document.createElement("a");
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const deleteClipboard = async () => {
    const res = await fetch(`/api/clipboards/${clipboard.name}`, {
      method: "DELETE",
      body: new FormData(),
    });
    if (res.status === 204) {
      await fetchClipboards();
      navigate(-1);
    } else {
      console.error("Error occured while deleting this clipboard:", res);
    }
  };

  React.useEffect(() => {
    const extractData = async () => {
      if (
        !hasRun.current ||
        clipboardName !== name // New clipboard is selected from drawer hence clipboardName change without re-render of component
      ) {
        hasRun.current = true;
        setName(clipboardName);
        if (clipboard.is_encrypted) {
          let passwd: string | null = null;
          while (passwd === null) {
            passwd = prompt("Enter password: ");
            if (passwd === null) continue;
            try {
              const decryptedText = await decryptText(clipboard.text, passwd);
              setText(decryptedText);
              setPassword(passwd);
            } catch (error) {
              alert("Invalid password!");
              passwd = null;
            }
          }
        } else {
          setText(String.fromCharCode(...clipboard.text));
        }
      }
    };

    extractData();
  }, [clipboardList, clipboard]);

  return (
    <Paper
      elevation={3}
      sx={{
        justifySelf: "center",
        width: {
          xs: "90vw",
          md: "75%",
        },
        padding: 2,
        marginTop: 5,
      }}
    >
      <Stack>
        <Button
          variant="contained"
          size="small"
          color="error"
          sx={{
            alignSelf: "flex-end",
          }}
          onClick={deleteClipboard}
        >
          Delete
        </Button>
      </Stack>
      <Typography variant="h4">{clipboard.name}</Typography>
      <Divider sx={{ marginBottom: 5 }} />
      <Box sx={{ position: "relative", marginBottom: 2 }}>
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: -10,
            left: 10,
            backgroundColor: "white",
            paddingX: 0.5,
            color: "primary.main",
            fontSize: "0.8rem",
          }}
        >
          Text
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: "monospace",
            border: "1px solid",
            borderColor: "primary.main",
            borderRadius: 1,
            padding: 2,
            overflowX: "auto",
            fontSize: "small",
          }}
        >
          {text}
        </Box>
      </Box>
      <Divider />
      <Typography variant="h5" marginTop={2} marginBottom={-1}>
        Files
      </Typography>
      <List>
        {Object.entries(clipboard.files).map(([_s, file]) => {
          return (
            <ListItemButton
              key={file.id}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                marginY: 1,
              }}
              onClick={() => downloadFile(file.name, file.id)}
            >
              <ListItemText
                primary={file.name}
                secondary={formatBytes(file.size)}
                sx={{
                  wordBreak: "break-all",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
};

export default Clip;
