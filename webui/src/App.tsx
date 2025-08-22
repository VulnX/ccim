import { Box, Divider, Fab, Stack, Tooltip } from "@mui/material";
import SearchBar from "./components/SearchBar";
import ClipboardList from "./components/ClipboardList";
import AddIcon from "@mui/icons-material/Add";

function App() {
  return (
    <>
      <Box sx={{ paddingY: 1, paddingX: { xs: 1, lg: 30 } }}>
        <Stack spacing={5} divider={<Divider orientation="horizontal" />}>
          <SearchBar />
          <ClipboardList />
        </Stack>
      </Box>
      <Tooltip title="New">
        <Fab
          color="primary"
          sx={{
            position: "absolute",
            right: 32,
            bottom: 32,
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </>
  );
}

export default App;
