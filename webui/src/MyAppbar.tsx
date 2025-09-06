import React from "react";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { drawerWidth } from "./App";

type MyAppbarProps = {
  isMobile: boolean;
  handleDrawerToggle: () => void;
};

const MyAppbar: React.FC<MyAppbarProps> = ({
  isMobile,
  handleDrawerToggle,
}) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        backgroundColor: "white",
        color: "black",
        boxShadow: 1,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          paddingX: 3,
        }}
      >
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ marginRight: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box
          component="img"
          src="/assets/logo/logo.svg"
          alt="CCIM Logo"
          sx={{
            height: {
              xs: "50px",
              md: "80px",
            },
          }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default MyAppbar;
