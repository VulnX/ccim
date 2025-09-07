import React from "react";
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
import { useNavigate, type NavigateFunction } from "react-router-dom";
import type { JSX } from "@emotion/react/jsx-runtime";
import type { GetClipboardResponse } from "./util/types";
import { getRemainingTime } from "./util/helper";
import { useClipboard } from "./context/ClipboardContext";

type MyDrawerProps = {
  isMobile: boolean;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
};

const ClipboardList: React.FC = () => {
  const navigate = useNavigate();
  const hasRun = React.useRef(false);
  const { clipboardList, setClipboardList } = useClipboard()!;
  const [clipboardListElements, setClipboardListElements] = React.useState<
    JSX.Element[]
  >([]);

  const fetchClipboards = async () => {
    const response = await fetch("/api/clipboards");
    if (response.status === 204) {
      setClipboardList([]);
      setClipboardListElements([]);
      return;
    }
    if (response.status !== 200) {
      console.error("Failed to get all clipboards");
      return;
    }
    const text = await response.text();
    const parsed: GetClipboardResponse[] = JSON.parse(text);
    setClipboardList(parsed);
  };

  function createClipboardListItem(
    clipboard: GetClipboardResponse,
    idx: number,
    navigate: NavigateFunction
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
        onClick={() => {
          navigate(`/clip/${clipboard.name}`);
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

  React.useEffect(() => {
    const newClipboardList = clipboardList.map((clipboard, idx) => {
      return createClipboardListItem(clipboard, idx, navigate);
    });
    setClipboardListElements(newClipboardList);
  }, [clipboardList]);

  return <List>{clipboardListElements}</List>;
};

const MyDrawer: React.FC<MyDrawerProps> = ({
  isMobile,
  mobileOpen,
  handleDrawerToggle,
}) => {
  const navigate = useNavigate();

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
          navigate("/create"), handleDrawerToggle();
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
        <ClipboardList />
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
