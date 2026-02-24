import React from "react";
import { Toolbar, CssBaseline, useMediaQuery, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MyDrawer from "./DrawerContent";
import MyAppbar from "./MyAppbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Create from "./pages/create/Create";
import Clip from "./pages/clip/Clip";
import Home from "./pages/home/Home";
import { useClipboard } from "./context/ClipboardContext";
import Loading from "./components/Loading";
import { keyframes } from "@mui/system";

export const drawerWidth = 260;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const App = () => {
  const { loading } = useClipboard()!;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();

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

        {loading ? (
          <Loading />
        ) : (
          /* Pages */
          <Box
            sx={{
              animation: `${fadeIn} 0.6s ease-out`,
            }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Create key={location.key} />} />
              <Route path="/clip/:clipboardName" element={<Clip />} />
            </Routes>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default App;
