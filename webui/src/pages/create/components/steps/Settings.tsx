import React from "react";
import {
  Switch,
  Collapse,
  Box,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Divider,
  Select,
  MenuItem,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

type SettingsStepProps = {
  expiry: number;
  setExpiry: React.Dispatch<React.SetStateAction<number>>;
  isEncrypted: boolean;
  setIsEncrypted: React.Dispatch<React.SetStateAction<boolean>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
};

const SettingsStep: React.FC<SettingsStepProps> = ({
  expiry,
  setExpiry,
  isEncrypted,
  setIsEncrypted,
  password,
  setPassword,
}) => {
  const switchRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setIsEncrypted((prev) => !prev);
  };

  const handleStackClick = (event: React.MouseEvent) => {
    // If the switch itself was clicked, let it handle its own event
    if (event.target === switchRef.current) {
      return;
    }
    handleToggle();
  };

  const handleEncStateChanged = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIsEncrypted(event.target.checked);
  };

  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <Stack divider={<Divider sx={{ marginY: 2 }} />} sx={{ paddingTop: 2 }}>
      <Box>
        <FormControl
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              backgroundColor: "#f9f9f9",
              "& fieldset": { borderColor: "#e0e0e0" },
              "&:hover fieldset": { borderColor: "#1a1a1a" },
              "&.Mui-focused fieldset": { borderColor: "#1a1a1a" },
            },
            "& .MuiInputLabel-root.Mui-focused": { color: "#1a1a1a" },
          }}
        >
          <InputLabel>Expire after</InputLabel>
          <Select
            label="Expire after"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value as number)}
            sx={{ fontWeight: 600, color: "#1a1a1a" }}
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
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            cursor: "pointer",
            p: 1.5,
            borderRadius: 1,
            "&:hover": {
              background: "#f5f5f5",
            },
          }}
          onClick={handleStackClick}
        >
          <Typography
            flex={1}
            sx={{ fontWeight: 700, color: "#1a1a1a", fontSize: "0.95rem" }}
          >
            Enable encryption
          </Typography>
          <Switch
            ref={switchRef}
            checked={isEncrypted}
            onChange={handleEncStateChanged}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#1a1a1a",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.08)",
                },
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#1a1a1a",
              },
            }}
          />
        </Stack>
        <Collapse in={isEncrypted}>
          <Box
            sx={{
              marginTop: 2,
              p: 2.5,
              borderRadius: 1,
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
            }}
          >
            <Alert
              severity="warning"
              variant="outlined"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                color: "#c0392b",
                borderColor: "#fadbd8",
                backgroundColor: "#fef5f5",
                "& .MuiAlert-icon": { color: "#e74c3c" },
              }}
            >
              Essential: Password cannot be changed or removed later. Keep it
              safe.
            </Alert>
            <FormControl sx={{ marginTop: 3 }} fullWidth variant="outlined">
              <InputLabel
                htmlFor="password-input"
                sx={{ "&.Mui-focused": { color: "#1a1a1a" } }}
              >
                Password
              </InputLabel>
              <OutlinedInput
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  borderRadius: 1,
                  background: "#f9f9f9",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1a1a1a",
                    borderWidth: 2,
                  },
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>
          </Box>
        </Collapse>
      </Box>
    </Stack>
  );
};

export default SettingsStep;
