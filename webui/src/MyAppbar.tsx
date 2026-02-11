import React from "react";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { drawerWidth } from "./App";
import { useNavigate } from "react-router-dom";
import logo from "/assets/logo/logo.svg";

type MyAppbarProps = {
  isMobile: boolean;
  handleDrawerToggle: () => void;
};

const MyAppbar: React.FC<MyAppbarProps> = ({
  isMobile,
  handleDrawerToggle,
}) => {
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        background: "white",
        color: "black",
        borderBottom: "1px solid #e0e0e0",
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
            sx={{
              marginRight: 2,
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box
          component="img"
          src={logo}
          alt="CCIM Logo"
          sx={{
            height: {
              xs: "55px",
              md: "75px",
            },
            cursor: "pointer",
            transition: "opacity 0.2s ease",
            "&:hover": {
              opacity: 0.8,
            },
          }}
          onClick={() => navigate("/")}
        />
      </Toolbar>
    </AppBar>
  );
};

export default MyAppbar;
