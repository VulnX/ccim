import React from "react";
import {
  Switch,
  Collapse,
  Box,
  Typography,
  Stack,
  Alert,
  TextField,
} from "@mui/material";

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

  const handleChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsEncrypted(event.target.checked);
  };

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
          onChange={handleChanged}
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
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              marginTop: 3,
            }}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export default SecurityStep;
