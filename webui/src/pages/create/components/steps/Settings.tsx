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
    <Stack divider={<Divider sx={{ marginY: 3 }} />} sx={{ paddingTop: 2 }}>
      <Box>
        <FormControl fullWidth>
          <InputLabel>Expire after</InputLabel>
          <Select
            label="Expire after"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
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
          }}
          onClick={handleStackClick}
        >
          <Typography flex={1}>Enable encryption?</Typography>
          <Switch
            ref={switchRef}
            checked={isEncrypted}
            onChange={handleEncStateChanged}
          />
        </Stack>
        <Collapse in={isEncrypted}>
          <Box
            sx={{
              marginTop: 2,
            }}
          >
            <Alert severity="warning">
              Password cannot be changed/removed later
            </Alert>
            <FormControl sx={{ marginTop: 3 }} fullWidth variant="outlined">
              <InputLabel htmlFor="password-input">Password</InputLabel>
              <OutlinedInput
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
