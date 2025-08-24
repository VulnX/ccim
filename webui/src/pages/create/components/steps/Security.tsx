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
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

type SecurityStepProps = {
  isEncrypted: boolean;
  setIsEncrypted: React.Dispatch<React.SetStateAction<boolean>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
};

const SecurityStep: React.FC<SecurityStepProps> = ({
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
  );
};

export default SecurityStep;
