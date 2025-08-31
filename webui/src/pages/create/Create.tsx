import React from "react";
import Navbar from "./components/Navbar";
import CreateClipboardStepper from "./components/CreateClipboardStepper";
import { Box, LinearProgress } from "@mui/material";

const Create: React.FC = () => {
  const [progress, setProgress] = React.useState<null | number>(null);
  return (
    <>
      <Navbar />
      <Box
        sx={{
          maxWidth: {
            xs: "100%",
            lg: "70%",
          },
          marginLeft: {
            xs: "0%",
            lg: "15%",
          },
        }}
      >
        <CreateClipboardStepper setProgress={setProgress} />
        {progress !== null && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              maxWidth: {
                xs: "90%",
                lg: "100%",
              },
              marginLeft: {
                xs: "5%",
                lg: "0%",
              },
            }}
          />
        )}
      </Box>
    </>
  );
};

export default Create;
