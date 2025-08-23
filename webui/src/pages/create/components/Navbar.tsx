import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import type React from "react";
import { useNavigate } from "react-router-dom";

const Navbar: React.FC = () => {
  const nagivate = useNavigate();
  const goBack = () => {
    nagivate(-1);
  };

  return (
    <AppBar
      position="sticky"
      sx={{ backgroundColor: "white", marginBottom: 5, color: "black" }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={goBack}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, marginLeft: 2 }}>
          Create clipboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
