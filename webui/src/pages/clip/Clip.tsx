import {
  Box,
  Button,
  Dialog,
  DialogContent,
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
import LockIcon from "@mui/icons-material/Lock";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const Clip: React.FC = () => {
  const navigate = useNavigate();
  const { clipboardName } = useParams();
  const { clipboardList, fetchClipboards } = useClipboard()!;
  const clipboard = clipboardList.find((clip) => clip.name === clipboardName);

  if (!clipboard) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h4" fontWeight={700}>
          404 Not Found
        </Typography>
        <Button onClick={() => navigate("/")} sx={{ mt: 2 }}>
          Home
        </Button>
      </Box>
    );
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
      const response = await fetch(`/api/clipboards/file/${fileId}`);
      const arrayBuffer = await response.arrayBuffer();

      let blob: Blob;
      if (clipboard.is_encrypted) {
        enqueueSnackbar("Decrypting...");
        const decryptedData = await decryptData(
          new Uint8Array(arrayBuffer),
          password!,
        );
        blob = new Blob([decryptedData], {
          type: "application/octet-stream",
        });
      } else {
        blob = new Blob([arrayBuffer], {
          type: "application/octet-stream",
        });
      }

      enqueueSnackbar("Download starting...");
      const link = document.createElement("a");
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      enqueueSnackbar("Download failed", { variant: "error" });
    }
  };

  const deleteClipboard = async () => {
    const formData = new FormData();
    if (clipboard.is_encrypted) {
      const passwd_hash = await preparePassword(password!);
      formData.append(
        "passwd",
        JSON.stringify(Array.from(new Uint8Array(passwd_hash))),
      );
    }
    const res = await fetch(`/api/clipboards/${clipboard.name}`, {
      method: "DELETE",
      body: formData,
    });
    if (res.status === 204) {
      await fetchClipboards();
      enqueueSnackbar("Clipboard deleted");
      navigate("/");
    } else {
      enqueueSnackbar("Delete failed", { variant: "error" });
    }
  };

  const checkPassword = async () => {
    try {
      if (clipboard.text.length !== 0) {
        const decryptedText = await decryptText(clipboard.text, password!);
        setText(decryptedText);
      }
      setShowDialog(false);
    } catch (error) {
      enqueueSnackbar("Invalid password", { variant: "error" });
    }
  };

  React.useEffect(() => {
    const extractData = async () => {
      if (!hasRun.current || clipboardName !== name) {
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
  }, [clipboardList, clipboard, clipboardName, name]);

  return (
    <React.Fragment>
      <Dialog
        open={showDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogContent sx={{ p: 4, textAlign: "center" }}>
          <LockIcon sx={{ fontSize: 48, mb: 2, color: "#1a1a1a" }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Secure Access
          </Typography>
          <Typography variant="body2" sx={{ color: "#666666", mb: 4 }}>
            This clipboard is encrypted. Enter password to decrypt content.
          </Typography>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              checkPassword();
            }}
          >
            <FormControl fullWidth variant="outlined">
              <InputLabel htmlFor="password-input">Password</InputLabel>
              <OutlinedInput
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password || ""}
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
                sx={{
                  borderRadius: 1,
                  background: "#f9f9f9",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1a1a1a",
                  },
                }}
              />
              <Button
                variant="contained"
                disableElevation
                fullWidth
                sx={{
                  marginTop: 3,
                  background: "#1a1a1a",
                  color: "white",
                  fontWeight: 600,
                  py: 1.5,
                  textTransform: "none",
                  "&:hover": { background: "#000000" },
                }}
                onClick={checkPassword}
              >
                Decrypt
              </Button>
            </FormControl>
          </form>
        </DialogContent>
      </Dialog>

      <Paper
        elevation={0}
        sx={{
          maxWidth: "900px",
          mx: "auto",
          p: { xs: 2, md: 4 },
          marginTop: 5,
          background: "#ffffff",
          borderRadius: 1,
          border: "1px solid #e0e0e0",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: "#1a1a1a", mb: 0.5 }}
            >
              {clipboard.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <LockIcon sx={{ fontSize: "0.9rem" }} />
                {clipboard.is_encrypted ? "Encrypted" : "Public"}
              </Typography>
            </Stack>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            sx={{
              fontWeight: 600,
              color: "#e74c3c",
              borderColor: "#fadbd8",
              textTransform: "none",
              "&:hover": {
                borderColor: "#e74c3c",
                backgroundColor: "#fef5f5",
              },
            }}
            onClick={deleteClipboard}
          >
            Delete
          </Button>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ mb: 6 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <DescriptionIcon sx={{ color: "#1a1a1a", fontSize: "1.2rem" }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "#1a1a1a" }}
            >
              Text Content
            </Typography>
          </Stack>
          <Box
            component="pre"
            sx={{
              fontFamily: "'Space Mono', monospace",
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              padding: 3,
              overflowX: "auto",
              fontSize: "0.95rem",
              background: "#f9f9f9",
              minHeight: "150px",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              color: "#1a1a1a",
              lineHeight: 1.6,
            }}
          >
            {text || "No text content..."}
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <DownloadIcon sx={{ color: "#1a1a1a", fontSize: "1.2rem" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
              Files
            </Typography>
          </Stack>
          <List
            sx={{
              display: "grid",
              gridTemplateColumns: { sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {Object.entries(clipboard.files).map(([_s, file]) => {
              return (
                <ListItemButton
                  key={file.id}
                  sx={{
                    borderRadius: 1,
                    background: "white",
                    border: "1px solid #e0e0e0",
                    p: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#1a1a1a",
                      backgroundColor: "#f9f9f9",
                    },
                  }}
                  onClick={() => downloadFile(file.name, file.id)}
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
                    <DescriptionIcon fontSize="small" />
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
                </ListItemButton>
              );
            })}
          </List>
          {Object.keys(clipboard.files).length === 0 && (
            <Typography
              variant="body2"
              sx={{
                color: "#999999",
                fontStyle: "italic",
                textAlign: "center",
                py: 4,
              }}
            >
              No files attached to this clipboard.
            </Typography>
          )}
        </Box>
      </Paper>
    </React.Fragment>
  );
};

export default Clip;
