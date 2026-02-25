import React from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  TextField,
  Tooltip,
  Select,
  MenuItem,
  Switch,
  Collapse,
  Alert,
  OutlinedInput,
} from "@mui/material";
import {
  Add as AddIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  Settings as SettingsIcon,
  AutoFixHigh as AutoFixHighIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { getRandomName } from "./components/util/name";
import { createClipboard, type DialogDetails } from "./components/util";
import CustomDialog from "./components/CustomDialog";
import { useClipboard } from "../../context/ClipboardContext";
import { formatBytes } from "../../util/helper";

const Create: React.FC = () => {
  const [progress, setProgress] = React.useState<null | number>(null);
  const [showDialog, setShowDialog] = React.useState(false);

  // Form state
  const [name, setName] = React.useState(getRandomName());
  const [text, setText] = React.useState<string>("");
  const [fileList, setFileList] = React.useState<Array<File>>([]);
  const [expiry, setExpiry] = React.useState(5 * 60);
  const [isEncrypted, setIsEncrypted] = React.useState(false);
  const [password, setPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [dialogDetails, setDialogDetails] =
    React.useState<DialogDetails | null>(null);

  const { fetchClipboards } = useClipboard()!;
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateClipboard = (): void => {
    if (!name.trim()) {
      return;
    }
    setTimeout(async () => {
      const details = await createClipboard(
        setProgress,
        name,
        text,
        fileList,
        expiry,
        isEncrypted,
        password,
      );
      setDialogDetails(details);
      setShowDialog(true);
    }, 300);
  };

  const resetForm = () => {
    setName(getRandomName());
    setText("");
    setFileList([]);
    setExpiry(5 * 60);
    setIsEncrypted(false);
    setPassword("");
    setProgress(null);
  };

  const closeDialog = (): void => {
    const isSuccess = dialogDetails?.success;
    setShowDialog(false);
    fetchClipboards();
    if (isSuccess) {
      resetForm();
    } else {
      setProgress(null);
    }
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

    setFileList([...fileList, ...newFiles]);
  };

  const deleteFile = (fileToDelete: File) => {
    setFileList(fileList.filter((file) => file !== fileToDelete));
  };

  const regenerateName = () => {
    setName(getRandomName());
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <Box
      sx={{
        maxWidth: "900px",
        mx: "auto",
        px: { xs: 2, lg: 0 },
        pb: 8,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          marginTop: 5,
          background: "#ffffff",
          borderRadius: 1,
          border: "1px solid #e0e0e0",
        }}
      >
        {/* Header Section */}
        <Box sx={{ width: "100%", mb: 4 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#666666",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              mb: 1,
              display: "block"
            }}
          >
            Clipboard Name
          </Typography>
          <TextField
            fullWidth
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputProps={{
              disableUnderline: false,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Regenerate random name" arrow>
                    <IconButton
                      size="small"
                      onClick={regenerateName}
                      sx={{ color: "#666666", p: 0.5 }}
                    >
                      <AutoFixHighIcon fontSize="medium" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              sx: {
                fontSize: { xs: "1.5rem", md: "2.125rem" },
                fontWeight: 800,
                color: "#1a1a1a",
                "&:before": { borderBottomColor: "#e0e0e0" },
                "&:after": { borderBottomColor: "#1a1a1a" },
                paddingBottom: "4px"
              },
            }}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Text Content Section */}
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
          <TextField
            fullWidth
            multiline
            minRows={6}
            placeholder="Paste or type your content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
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
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Files Section */}
        <Box sx={{ mb: 6 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AddIcon sx={{ color: "#1a1a1a", fontSize: "1.2rem" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#1a1a1a" }}
              >
                Files
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<AddIcon />}
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
            >
              Add Files
            </Button>
            <input
              type="file"
              multiple
              hidden
              ref={fileInputRef}
              onChange={handleFilePicker}
            />
          </Stack>

          <List
            sx={{
              display: "grid",
              gridTemplateColumns: { sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {fileList.map((file, idx) => (
              <ListItem
                key={idx}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => deleteFile(file)}
                    sx={{
                      color: "#e74c3c",
                      "&:hover": { background: "#fef5f5" },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  borderRadius: 1,
                  background: "white",
                  border: "1px solid #e0e0e0",
                  p: 2,
                  "&:hover": { borderColor: "#1a1a1a" },
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
                  sx={{ wordBreak: "break-all" }}
                />
              </ListItem>
            ))}
          </List>
          {fileList.length === 0 && (
            <Typography
              variant="body2"
              sx={{
                color: "#999999",
                fontStyle: "italic",
                textAlign: "center",
                py: 4,
                border: "1px dashed #e0e0e0",
                borderRadius: 1,
              }}
            >
              No files selected yet...
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Settings Section (Expandable) */}
        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            mb={showSettings ? 4 : 0}
            onClick={() => setShowSettings(!showSettings)}
            sx={{
              cursor: "pointer",
              userSelect: "none",
              p: 1,
              mx: -1,
              borderRadius: 1,
              transition: "all 0.2s ease",
              "&:hover": { background: "#f5f5f5" },
            }}
          >
            <SettingsIcon sx={{ color: "#1a1a1a", fontSize: "1.2rem" }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#1a1a1a", flex: 1 }}
            >
              Advanced Settings
            </Typography>
            {showSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Stack>

          <Collapse in={showSettings}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={4}
              divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />}
            >
              {/* Expiry Setting */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#666666" }}>
                  Expiration
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value as number)}
                    variant="outlined"
                    sx={{
                      background: "#f9f9f9",
                      fontWeight: 600,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#1a1a1a" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1a1a1a" },
                    }}
                  >
                    <MenuItem value={60}>1 minute</MenuItem>
                    <MenuItem value={5 * 60}>5 minutes</MenuItem>
                    <MenuItem value={15 * 60}>15 minutes</MenuItem>
                    <MenuItem value={60 * 60}>1 hour</MenuItem>
                    <MenuItem value={3 * 60 * 60}>3 hours</MenuItem>
                    <MenuItem value={8 * 60 * 60}>8 hours</MenuItem>
                    <MenuItem value={12 * 60 * 60}>12 hours</MenuItem>
                    <MenuItem value={24 * 60 * 60}>24 hours</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Encryption Setting */}
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#666666" }}>
                    Encryption
                  </Typography>
                  <Switch
                    checked={isEncrypted}
                    onChange={(e) => setIsEncrypted(e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#1a1a1a",
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.08)" },
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#1a1a1a",
                      },
                    }}
                  />
                </Stack>
                <Collapse in={isEncrypted}>
                  <Box sx={{ mt: 2 }}>
                    <Alert
                      severity="warning"
                      variant="outlined"
                      sx={{
                        borderRadius: 1,
                        mb: 2,
                        py: 0,
                        fontWeight: 600,
                        color: "#c0392b",
                        borderColor: "#fadbd8",
                        backgroundColor: "#fef5f5",
                        "& .MuiAlert-icon": { color: "#e74c3c" },
                      }}
                    >
                      Password cannot be changed later.
                    </Alert>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel
                        htmlFor="create-password-input"
                        sx={{ "&.Mui-focused": { color: "#1a1a1a" } }}
                      >
                        Password
                      </InputLabel>
                      <OutlinedInput
                        id="create-password-input"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        label="Password"
                        sx={{
                          background: "#f9f9f9",
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1a1a1a" },
                        }}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton onClick={handleClickShowPassword} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Box>
                </Collapse>
              </Box>
            </Stack>
          </Collapse>
        </Box>

        <Box sx={{ mt: 6 }}>
          <Button
            variant="contained"
            disableElevation
            fullWidth
            onClick={handleCreateClipboard}
            disabled={progress !== null || !name.trim()}
            sx={{
              py: 2,
              background: "#1a1a1a",
              color: "white",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1.1rem",
              borderRadius: 1,
              "&:hover": { background: "#000000" },
            }}
          >
            {progress !== null ? "Creating Clipboard..." : "Create Clipboard"}
          </Button>

          {progress !== null && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 1,
                background: "#f5f5f5",
                mt: 2,
                "& .MuiLinearProgress-bar": {
                  background: "#1a1a1a",
                },
              }}
            />
          )}
        </Box>
      </Paper>

      <CustomDialog
        showDialog={showDialog}
        closeDialog={closeDialog}
        dialogDetails={dialogDetails}
      />
    </Box>
  );
};

export default Create;
