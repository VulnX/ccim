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

type MyDrawerProps = {
  isMobile: boolean;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
};

const MyDrawer: React.FC<MyDrawerProps> = ({
  isMobile,
  mobileOpen,
  handleDrawerToggle
}) => {
  const drawerContent = (
    <Stack
      direction="column"
      sx={{ height: "100%", padding: 1, backgroundColor: "#f9f9f9" }}
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
        <List>
          {[
            "clipboard 1",
            "clipboard 2",
            "clipboard 3 and something else as well",
          ].map((text) => (
            <ListItemButton
              key={text}
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
                <Tooltip title={text} placement="top" arrow>
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {text}
                  </span>
                </Tooltip>
                <Stack direction="row" gap={0.5}>
                  <Chip
                    variant="outlined"
                    label="Public"
                    size="small"
                    color="primary"
                  />
                  <Tooltip title={`expires in 2h 5m`} arrow>
                    <Chip
                      variant="outlined"
                      label="2h 5m"
                      size="small"
                      color="default"
                    />
                  </Tooltip>
                </Stack>
              </Stack>
            </ListItemButton>
          ))}
        </List>
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
