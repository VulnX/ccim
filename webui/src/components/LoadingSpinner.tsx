import { Box, CircularProgress, Typography } from "@mui/material";

const LoadingSpinner = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 3,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <CircularProgress
          size={50}
          thickness={4}
          sx={{
            color: "#1a1a1a",
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#1a1a1a", // Pure Black Theme
            }}
          />
        </Box>
      </Box>
      <Typography
        sx={{
          color: "#666666",
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
      >
        LOADING
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
