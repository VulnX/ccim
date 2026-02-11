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
  TextField,
} from "@mui/material";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatBytes } from "../../util/helper";
import { useClipboard } from "../../context/ClipboardContext";
import {
  decryptData,
  decryptText,
  preparePassword,
  encryptText,
  encryptFile,
} from "../../util/crypto";
import { enqueueSnackbar } from "notistack";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import LockIcon from "@mui/icons-material/Lock";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

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

  const [name, setName] = React.useState<string | undefined>(undefined);
  const [text, setText] = React.useState<string | undefined>(undefined);
  const [password, setPassword] = React.useState<string | undefined>(undefined);
  const [showDialog, setShowDialog] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState<string>("");
  const [deletedFileIds, setDeletedFileIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [newFiles, setNewFiles] = React.useState<File[]>([]);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      const hasTextChanged = editedText !== text;
      const hasFilesDeleted = deletedFileIds.size > 0;
      const hasFilesAdded = newFiles.length > 0;

      if (!hasTextChanged && !hasFilesDeleted && !hasFilesAdded) {
        setIsEditing(false);
        setIsUpdating(false);
        return;
      }

      interface UpdateInfo {
        new_text?: number[];
        new_passwd?: number[];
        passwd?: number[];
      }
      const info: UpdateInfo = {};
      if (hasTextChanged) {
        if (clipboard.is_encrypted) {
          const encryptedBlob = await encryptText(editedText, password!);
          const arrayBuffer = await encryptedBlob.arrayBuffer();
          info.new_text = Array.from(new Uint8Array(arrayBuffer));
        } else {
          info.new_text = Array.from(new TextEncoder().encode(editedText));
        }
      }

      if (clipboard.is_encrypted) {
        const passwd_hash = await preparePassword(password!);
        info.passwd = Array.from(new Uint8Array(passwd_hash));
      }

      formData.append("info", JSON.stringify(info));

      if (hasFilesDeleted) {
        formData.append("delete", JSON.stringify(Array.from(deletedFileIds)));
      }

      for (const file of newFiles) {
        if (clipboard.is_encrypted) {
          const encryptedBlob = await encryptFile(file, password!);
          formData.append("file", encryptedBlob, file.name);
        } else {
          formData.append("file", file, file.name);
        }
      }

      const res = await fetch(`/api/clipboards/${clipboard.name}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        enqueueSnackbar("Clipboard updated successfully");
        await fetchClipboards(true);
        setIsEditing(false);
        setDeletedFileIds(new Set());
        setNewFiles([]);
      } else {
        const errorData = await res.json();
        enqueueSnackbar(errorData.message || "Update failed", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      enqueueSnackbar("An error occurred during update", { variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleEdit = () => {
    if (!isEditing) {
      setEditedText(text || "");
    } else {
      // Reset changes if cancelling
      setDeletedFileIds(new Set());
      setNewFiles([]);
    }
    setIsEditing(!isEditing);
  };

  const handleFileDeleteRequest = (fileId: string) => {
    setDeletedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
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

  const handleClose = () => {
    navigate("/");
  };

  React.useEffect(() => {
    const extractData = async () => {
      if (!clipboard) return;

      // If switching to a different clipboard, reset internal state
      if (clipboardName !== name) {
        setName(clipboardName);
        setPassword(undefined);
        setText(undefined);
        setIsEditing(false);
        setDeletedFileIds(new Set());
        setNewFiles([]);

        if (clipboard.is_encrypted) {
          setShowDialog(true);
        } else {
          setText(String.fromCharCode(...clipboard.text));
          setShowDialog(false);
        }
        return;
      }

      // If we are on the same clipboard but data changed (e.g. after update)
      if (clipboard.is_encrypted) {
        // If we already have a password and are not currently showing the dialog, re-decrypt
        if (password && !showDialog) {
          try {
            const decryptedText = await decryptText(clipboard.text, password);
            setText(decryptedText);
          } catch (error) {
            // Password might be invalid for the new data (shouldn't happen here)
            setShowDialog(true);
          }
        } else if (!password) {
          setShowDialog(true);
        }
      } else {
        setText(String.fromCharCode(...clipboard.text));
        setShowDialog(false);
      }
    };
    extractData();
  }, [clipboard, clipboardName, name, password, showDialog]);

  return (
    <React.Fragment>
      <Dialog open={showDialog} fullWidth maxWidth="xs">
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
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
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={isEditing ? <CloseIcon /> : <EditIcon />}
              sx={{
                fontWeight: 600,
                color: "#1a1a1a",
                borderColor: "#e0e0e0",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#1a1a1a",
                  backgroundColor: "#f9f9f9",
                },
              }}
              onClick={toggleEdit}
              disabled={isUpdating}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            {!isEditing && (
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
            )}
            {isEditing && (
              <Button
                variant="contained"
                size="small"
                sx={{
                  background: "#1a1a1a",
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { background: "#000000" },
                }}
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            )}
          </Stack>
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
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              minRows={6}
              value={editedText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditedText(e.target.value)
              }
              variant="outlined"
              sx={{
                background: "#f9f9f9",
                "& .MuiOutlinedInput-root": {
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.95rem",
                  "& fieldset": { borderColor: "#e0e0e0" },
                  "&.Mui-focused fieldset": { borderColor: "#1a1a1a" },
                },
              }}
            />
          ) : (
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
          )}
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            mb={2}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <DownloadIcon sx={{ color: "#1a1a1a", fontSize: "1.2rem" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#1a1a1a" }}
              >
                Files
              </Typography>
            </Stack>
            {isEditing && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  fontWeight: 600,
                  color: "#1a1a1a",
                  borderColor: "#e0e0e0",
                  textTransform: "none",
                }}
              >
                Add Files
              </Button>
            )}
            <input
              type="file"
              multiple
              hidden
              ref={fileInputRef}
              onChange={onFileChange}
            />
          </Stack>
          <List
            sx={{
              display: "grid",
              gridTemplateColumns: { sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {Object.entries(clipboard.files).map(([_s, file]) => {
              const isDeleted = deletedFileIds.has(file.id);
              return (
                <ListItemButton
                  key={file.id}
                  sx={{
                    borderRadius: 1,
                    background: "white",
                    border: "1px solid #e0e0e0",
                    p: 2,
                    transition: "all 0.2s ease",
                    opacity: isDeleted ? 0.5 : 1,
                    textDecoration: isDeleted ? "line-through" : "none",
                    "&:hover": {
                      borderColor: isEditing ? "#e74c3c" : "#1a1a1a",
                      backgroundColor: isEditing ? "#fef5f5" : "#f9f9f9",
                    },
                  }}
                  onClick={() =>
                    isEditing
                      ? handleFileDeleteRequest(file.id)
                      : downloadFile(file.name, file.id)
                  }
                >
                  <Box
                    sx={{
                      mr: 2,
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      background: isDeleted ? "#fadbd8" : "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDeleted ? "#e74c3c" : "#1a1a1a",
                      flexShrink: 0,
                    }}
                  >
                    {isEditing ? (
                      <DeleteOutlineIcon fontSize="small" />
                    ) : (
                      <DescriptionIcon fontSize="small" />
                    )}
                  </Box>
                  <ListItemText
                    primary={file.name}
                    secondary={formatBytes(file.size)}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      color: isDeleted ? "#e74c3c" : "#1a1a1a",
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
            {isEditing &&
              newFiles.map((file, index) => (
                <ListItemButton
                  key={`new-${index}`}
                  sx={{
                    borderRadius: 1,
                    background: "#f0f7ff",
                    border: "1px dashed #2196f3",
                    p: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#e74c3c",
                      backgroundColor: "#fef5f5",
                    },
                  }}
                  onClick={() => removeNewFile(index)}
                >
                  <Box
                    sx={{
                      mr: 2,
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      background: "#e3f2fd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2196f3",
                      flexShrink: 0,
                    }}
                  >
                    <AddIcon fontSize="small" />
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
              ))}
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
