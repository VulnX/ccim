import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import type React from "react";

type ClipboardEntryProps = {
  message: string;
  isEncypted: boolean;
};

const ClipboardEntry: React.FC<ClipboardEntryProps> = ({
  message,
  isEncypted,
}) => {
  return (
    <Paper elevation={2} sx={{ padding: "16px" }}>
      <Box display="flex" justifyContent="space-between">
        <Typography>{message}</Typography>
        <Tooltip title={isEncypted ? "Private" : "Public"}>
          <IconButton disableRipple>
            {isEncypted ? (
              <LockIcon color="error" />
            ) : (
              <PublicIcon color="info" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default ClipboardEntry;
