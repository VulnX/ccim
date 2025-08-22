import { Box, Card, Collapse, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import type React from "react";
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';

type ClipboardEntryProps = {
  name: string;
  isEncypted: boolean;
  text: string;
  files: Record<string, string>;
};

const ClipboardEntry: React.FC<ClipboardEntryProps> = ({
  name,
  isEncypted,
  text = "This is the default text content.",
  files = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Paper elevation={2} sx={{ padding: "16px", cursor: "pointer", "&:hover": { boxShadow: 4 }, }} onClick={handleToggleExpand}>
      <Box display="flex" justifyContent="space-between">
        <Typography>{name}</Typography>
        <Tooltip title={isExpanded ? "Edit" : isEncypted ? "Private" : "Public"}>
          <IconButton disableRipple={!isExpanded} onClick={e => e.stopPropagation()}>
            {isExpanded ? (<EditIcon />) : isEncypted ? (
              <LockIcon color="error" />
            ) : (
              <PublicIcon color="info" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit onClick={e => e.stopPropagation}>
        <Box
          sx={{ marginTop: 2, padding: 2 }}
        >
          <TextField fullWidth defaultValue={text} slotProps={{ input: {readOnly: true } }} />
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ClipboardEntry;
