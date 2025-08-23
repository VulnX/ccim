import { CreateOutlined } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

function CreateNewButton() {
  const nagivate = useNavigate();
  const redirectTo = (path: string) => {
    nagivate(path);
  };
  return (
    <Stack
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Button
        variant="contained"
        sx={{
          position: "fixed",
          bottom: {
            xs: 16,
            lg: 48,
          },
          right: {
            xs: 24,
            lg: 64,
          },
          paddingX: {
            xs: 1.5,
            lg: 2,
          },
          paddingY: 1.5,
          borderRadius: 3,
          fontSize: {
            xs: "1rem",
            lg: "1rem",
          },
          // Icon size
          "& .MuiButton-startIcon": {
            "& > *:first-of-type": {
              fontSize: "1.8rem",
            },
          },
        }}
        onClick={() => redirectTo("/create")}
        startIcon={<CreateOutlined />}
      >
        NEW
      </Button>
    </Stack>
  );
}

export default CreateNewButton;
