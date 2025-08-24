import React, { useRef } from "react";
import {
  Switch,
  Collapse,
  Box,
  Typography,
  Stack,
  Alert,
  TextField,
} from "@mui/material";

function SecurityStep() {
  const [checked, setChecked] = React.useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setChecked((prev) => !prev);
  };

  const handleStackClick = (event: React.MouseEvent) => {
    // If the switch itself was clicked, let it handle its own event
    if (event.target === switchRef.current) {
      return;
    }
    handleToggle();
  };

  const handleChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
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
        <Switch ref={switchRef} checked={checked} onChange={handleChanged} />
      </Stack>
      <Collapse in={checked}>
        <Box
          sx={{
            marginTop: 2,
          }}
        >
          <Alert severity="warning">Password cannot be changed/removed again</Alert>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Password"
            sx={{
              marginTop: 3
            }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export default SecurityStep;
