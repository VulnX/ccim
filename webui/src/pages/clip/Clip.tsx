import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatBytes } from "../../util/helper";
import { useClipboard } from "../../context/ClipboardContext";
import { decryptData, decryptText, preparePassword } from "../../util/crypto";
import { enqueueSnackbar } from "notistack";
import { Visibility, VisibilityOff } from "@mui/icons-material";

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
  const [showDialog, setShowDialog] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const downloadFile = async (fileName: string, fileId: string) => {
    try {
      // Fetch the file's data (encrypted or not) from the server
      const response = await fetch(`/api/clipboards/file/${fileId}`);
      const arrayBuffer = await response.arrayBuffer();

      let blob: Blob;
      if (clipboard.is_encrypted) {
        // If the file is encrypted, decrypt it first
        enqueueSnackbar("🔐 Decrypting...");
        const decryptedData = await decryptData(
          new Uint8Array(arrayBuffer),
          password!
        );
        blob = new Blob([decryptedData], {
          type: "application/octet-stream",
        });
      } else {
        // If the file is not encrypted, download as it is
        blob = new Blob([arrayBuffer], {
          type: "application/octet-stream",
        });
      }

      enqueueSnackbar("Your download will start soon");
      const link = document.createElement("a");
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const deleteClipboard = async () => {
    const formData = new FormData();
    if (clipboard.is_encrypted) {
      const passwd_hash = await preparePassword(password!);
      formData.append(
        "passwd",
        JSON.stringify(Array.from(new Uint8Array(passwd_hash)))
      );
    }
    const res = await fetch(`/api/clipboards/${clipboard.name}`, {
      method: "DELETE",
      body: formData,
    });
    if (res.status === 204) {
      await fetchClipboards();
      enqueueSnackbar("Deleted clipboard");
      navigate(-1);
    } else {
      console.error("Error occured while deleting this clipboard:", res);
    }
  };

  const checkPassword = async () => {
    try {
      const decryptedText = await decryptText(clipboard.text, password!);
      setText(decryptedText);
      setShowDialog(false);
    } catch (error) {
      enqueueSnackbar("INVALID PASSWORD");
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
          setShowDialog(true);
        } else {
          setText(String.fromCharCode(...clipboard.text));
        }
      }
    };

    extractData();
  }, [clipboardList, clipboard]);

  return (
    <React.Fragment>
      <Dialog open={showDialog} fullWidth>
        <DialogContent>
          <DialogContentText>
            🔒 This clipboard is encrypted. Password is required to view it.
          </DialogContentText>
          <form onSubmit={(e) => { e.preventDefault(); checkPassword(); }}>
            <FormControl sx={{ marginTop: 3 }} fullWidth variant="outlined">
              <InputLabel htmlFor="password-input">Password</InputLabel>
              <OutlinedInput
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password!}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
              <Button
                variant="contained"
                sx={{ marginTop: 3 }}
                onClick={checkPassword}
              >
                Decrypt
              </Button>
            </FormControl>
          </form>
        </DialogContent>
      </Dialog>
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
    </React.Fragment>
  );
};

export default Clip;
