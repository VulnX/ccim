import React, { type JSX } from "react";
import {
  List,
  ListItemButton,
  Box,
  Stack,
  TextField,
  Button,
  Divider,
  Tooltip,
  Chip,
  Drawer,
} from "@mui/material";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import { drawerWidth } from "./App";
import { useNavigate } from "react-router-dom";

type MyDrawerProps = {
  isMobile: boolean;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
};

type GetClipboardResponse = {
  name: string;
  text: number[];
  file_map: { [key: string]: string };
  is_encrypted: boolean;
  expiry: number;
};

const MyDrawer: React.FC<MyDrawerProps> = ({
  isMobile,
  mobileOpen,
  handleDrawerToggle,
}) => {
  const nagivate = useNavigate();

  const [clipboardList, setClipboardList] = React.useState<JSX.Element[]>([]);
  const hasRun = React.useRef(false);

  const fetchClipboards = async () => {
    const response = await fetch("/api/clipboards");
    if (response.status === 204) {
      setClipboardList([]);
      return;
    }
    if (response.status !== 200) {
      console.error("Failed to get all clipboards");
      return;
    }
    const text = await response.text();
    const parsed: GetClipboardResponse[] = JSON.parse(text);
    console.log("parsed:", parsed);
    const newClipboardList = parsed.map((clipboard, idx) => {
      return createClipboardListItem(clipboard, idx);
    });
    setClipboardList(newClipboardList);
  };

  const getRemainingTime = (expiry: number): string => {
    const currentTimestamp = Date.now() / 1000;
    const difference = Math.max(0, expiry - currentTimestamp);
    const totalMinutes = Math.ceil(difference / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0 && minutes === 0) {
      return "expired";
    }
    if (hours === 0) {
      return `${minutes}m`;
    }
    if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  function createClipboardListItem(
    clipboard: GetClipboardResponse,
    idx: number,
  ) {
    return (
      <ListItemButton
        key={idx}
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          marginBottom: 1,
          width: "100%",
          display: "block",
        }}
      >
        <Stack>
          <Tooltip title={clipboard.name} placement="top" arrow>
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {clipboard.name}
            </span>
          </Tooltip>
          <Stack direction="row" gap={0.5}>
            <Chip
              variant="outlined"
              label={clipboard.is_encrypted ? "Secure" : "Public"}
              size="small"
              color={clipboard.is_encrypted ? "error" : "primary"}
            />
            <Tooltip
              title={`expires in ${getRemainingTime(clipboard.expiry)}`}
              arrow
            >
              <Chip
                variant="outlined"
                label={getRemainingTime(clipboard.expiry)}
                size="small"
                color="default"
              />
            </Tooltip>
          </Stack>
        </Stack>
      </ListItemButton>
    );
  }

  React.useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      fetchClipboards();
    }
  }, []);

  const drawerContent = (
    <Stack
      direction="column"
      sx={{ height: "100%", padding: 1, backgroundColor: "#fff" }}
    >
      <TextField
        variant="outlined"
        placeholder="Search..."
        size="small"
        sx={{ marginBottom: 2 }}
      />
      <Divider sx={{ marginBottom: 2 }} />
      <Button
        startIcon={<CreateOutlinedIcon />} // Use an icon similar to the one in your screenshot
        fullWidth
        sx={{
          justifyContent: "flex-start",
          borderRadius: 2,
          color: "black",
          textTransform: "none",
          paddingY: 1.5,
          paddingX: 2,
          boxShadow: "none",
          marginBottom: 2,
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            boxShadow: "none",
          },
        }}
        onClick={() => {
          (nagivate("/create"), handleDrawerToggle());
        }}
      >
        New Clipboard
      </Button>

      <Box
        sx={{
          maxHeight: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <Divider sx={{ marginBottom: 2 }} />
        <List>{clipboardList}</List>
      </Box>
    </Stack>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Temporary drawer for mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Permanent drawer for desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default MyDrawer;
