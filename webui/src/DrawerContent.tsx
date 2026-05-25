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
  InputAdornment,
} from "@mui/material";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import SearchIcon from "@mui/icons-material/Search";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { drawerWidth } from "./App";
import { useNavigate } from "react-router-dom";
import { getRemainingTime } from "./util/helper";
import { useClipboard } from "./context/ClipboardContext";

type MyDrawerProps = {
  isMobile: boolean;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
};

type ClipboardListProps = {
  handleDrawerToggle: () => void;
};

const ClipboardList: React.FC<ClipboardListProps> = ({
  handleDrawerToggle,
}) => {
  const navigate = useNavigate();
  const hasRun = React.useRef(false);
  const { clipboardList, fetchClipboards } = useClipboard()!;

  React.useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      fetchClipboards();
    }
  }, [fetchClipboards]);

  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <List sx={{ px: 1 }}>
      {clipboardList.map((clipboard) => {
        return (
          <ListItemButton
            key={clipboard.name}
            sx={{
              borderRadius: 1,
              border: "1px solid #e0e0e0",
              background: "#ffffff",
              marginBottom: 1,
              width: "100%",
              display: "block",
              position: "relative",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#1a1a1a",
                background: "#f9f9f9",
              },
              "&.Mui-selected": {
                borderColor: "#1a1a1a", // Pure Black Theme
                background: "#f9f9f9",
              },
            }}
            onClick={() => {
              navigate(`/clip/${clipboard.name}`);
              handleDrawerToggle();
            }}
          >
            <Stack>
              <Tooltip title={clipboard.name} placement="top" arrow>
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#1a1a1a",
                  }}
                >
                  {clipboard.name}
                </span>
              </Tooltip>
              <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                <Chip
                  icon={
                    clipboard.is_encrypted ? (
                      <LockIcon style={{ fontSize: "0.8rem" }} />
                    ) : (
                      <PublicIcon style={{ fontSize: "0.8rem" }} />
                    )
                  }
                  label={clipboard.is_encrypted ? "Secure" : "Public"}
                  size="small"
                  sx={{
                    borderRadius: 1,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    height: 20,
                    backgroundColor: clipboard.is_encrypted
                      ? "#f5f5f5"
                      : "#eeeeee",
                    color: "#666666",
                    "& .MuiChip-icon": { color: "#666666" },
                  }}
                />
                <Tooltip
                  title={`Expires in ${getRemainingTime(clipboard.expiry)}`}
                  arrow
                >
                  <Chip
                    icon={<AccessTimeIcon style={{ fontSize: "0.8rem" }} />}
                    label={getRemainingTime(clipboard.expiry)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      height: 20,
                      borderColor: "#e0e0e0",
                      color: "#666666",
                      "& .MuiChip-icon": { color: "#666666" },
                    }}
                  />
                </Tooltip>
              </Stack>
            </Stack>
          </ListItemButton>
        );
      })}
    </List>
  );
};

const MyDrawer: React.FC<MyDrawerProps> = ({
  isMobile,
  mobileOpen,
  handleDrawerToggle,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");

  const drawerContent = (
    <Stack
      direction="column"
      sx={{
        height: "100%",
        padding: 2,
        background: "#ffffff",
        borderRight: "1px solid #e0e0e0",
      }}
    >
      <TextField
        variant="outlined"
        placeholder="Search..."
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && searchTerm.trim()) {
            navigate(`/clip/${searchTerm.trim()}`);
            setSearchTerm("");
            handleDrawerToggle();
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "#666666", fontSize: "1.2rem" }} />
            </InputAdornment>
          ),
        }}
        sx={{
          marginBottom: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 1,
            backgroundColor: "#f5f5f5",
            "& fieldset": { borderColor: "transparent" },
            "&:hover fieldset": { borderColor: "#e0e0e0" },
            "&.Mui-focused fieldset": { borderColor: "#1a1a1a" },
          },
        }}
      />

      <Button
        startIcon={<CreateOutlinedIcon />}
        fullWidth
        variant="contained"
        disableElevation
        sx={{
          justifyContent: "center",
          borderRadius: 1,
          background: "#1a1a1a", // Pure Black Theme
          color: "white",
          textTransform: "none",
          paddingY: 1,
          fontWeight: 600,
          fontSize: "0.95rem",
          marginBottom: 3,
          "&:hover": {
            background: "#000000",
          },
        }}
        onClick={() => {
          navigate("/create");
          handleDrawerToggle();
        }}
      >
        New Clipboard
      </Button>

      <Divider sx={{ mb: 3 }} />

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f5f5f5",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#e0e0e0",
            borderRadius: "4px",
          },
        }}
      >
        <ClipboardList handleDrawerToggle={handleDrawerToggle} />
      </Box>
    </Stack>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
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
              border: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
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
