import React from "react";
import { Toolbar, CssBaseline, useMediaQuery, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MyDrawer from "./DrawerContent";
import MyAppbar from "./MyAppbar";
import { Route, Routes } from "react-router-dom";
import Create from "./pages/create/Create";
import Clip from "./pages/clip/Clip";
import type { GetClipboardResponse } from "./util/types";

export const drawerWidth = 260;

const App = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const [clipboardList, setClipboardList] = React.useState<
    GetClipboardResponse[]
  >([]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <MyAppbar isMobile={isMobile} handleDrawerToggle={handleDrawerToggle} />

      {/* Drawer */}
      <MyDrawer
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        clipboardList={clipboardList}
        setClipboardList={setClipboardList}
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

        {/* Pages */}
        <Routes>
          <Route path="/" element={<Create />} />
          <Route path="/create" element={<Create />} />
          <Route
            path="/clip/:clipboardName"
            element={<Clip clipboardList={clipboardList} />}
          />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;
