import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

type ClipboardEntryProps = {
  name: string;
  text: string;
  file_map: { [key: string]: string };
  isEncypted: boolean;
  expiry: number;
  reload: () => Promise<void>;
};

const ClipboardEntry: React.FC<ClipboardEntryProps> = ({
  name,
  isEncypted,
  text,
  file_map: files,
  expiry,
  reload,
}) => {
  const getTime = (expiry: number): string => {
    const currentTimestamp = Date.now() / 1000;
    const difference = Math.max(0, expiry - currentTimestamp);
    const totalMinutes = Math.ceil(difference / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}`;
  };

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [time, setTime] = React.useState(getTime(expiry));

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const downloadFile = (fileName: string, fileId: string) => {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = `/api/clipboards/file/${fileId}`;
    link.click();
  };

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const newTime = getTime(expiry);
      if (expiry <= Math.floor(Date.now() / 1000)) {
        clearInterval(interval);
        await reload();
        return;
      }
      setTime(newTime);
    }, 5000);

    return () => clearInterval(interval);
  }, [expiry]);

  return (
    <Paper elevation={2} sx={{ padding: "16px", "&:hover": { boxShadow: 4 } }}>
      <Stack
        sx={{ cursor: "pointer" }}
        direction="row"
        justifyContent="space-between"
        onClick={handleToggleExpand}
      >
        <Stack direction="row" alignItems={"center"}>
          {isExpanded ? (
            <KeyboardArrowDownRoundedIcon />
          ) : (
            <KeyboardArrowRightRoundedIcon />
          )}
          <Typography marginLeft={1}>{name}</Typography>
        </Stack>
        <Box>
          <Tooltip title="time remaining (in HH:MM)">
            <Chip
            label={time}
            color="primary"
            size="small"
            icon={<AccessTimeIcon />}
          />
          </Tooltip>
          <Tooltip
            title={isExpanded ? "Edit" : isEncypted ? "Private" : "Public"}
          >
            <IconButton
              disableRipple={!isExpanded}
              onClick={(e) => e.stopPropagation()}
            >
              {isExpanded ? (
                <EditIcon />
              ) : isEncypted ? (
                <LockIcon color="error" />
              ) : (
                <PublicIcon color="info" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ position: "relative", mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: -10,
              left: 10,
              backgroundColor: "white",
              px: 0.5,
              color: "primary.main",
              fontSize: "0.8rem",
            }}
          >
            Text
          </Typography>
          <Box
            component="pre"
            sx={{
              fontFamily: "monospace",
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 1,
              p: 2,
              overflowX: "auto",
            }}
          >
            {text}
          </Box>
        </Box>
        <Divider />
        <Typography variant="h5" marginTop={2}>
          Files
        </Typography>
        <Stack gap={2} marginTop={2}>
          {Object.entries(files).map(([fileName, fileId]) => {
            return (
              <Button
                key={fileId}
                fullWidth
                onClick={() => downloadFile(fileName, fileId)}
                sx={{
                  justifyContent: "start",
                  textTransform: "none",
                  textAlign: "left",
                  wordBreak: "break-word",
                }}
                variant="outlined"
              >
                {fileName}
              </Button>
            );
          })}
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default ClipboardEntry;
