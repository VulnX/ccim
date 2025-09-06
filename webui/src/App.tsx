import React from "react";
import {
  Toolbar,
  Typography,
  CssBaseline,
  useMediaQuery,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MyDrawer from "./DrawerContent";
import MyAppbar from "./MyAppbar";

export const drawerWidth = 260;

const App = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <MyAppbar isMobile={isMobile} handleDrawerToggle={handleDrawerToggle} />

      {/* Drawer */}
      <MyDrawer
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginTop: {
            xs: 0,
            md: "20px",
          },
          p: 2,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Typography>MAIN CONTENT HERE</Typography>
      </Box>
    </Box>
  );
};

export default App;
