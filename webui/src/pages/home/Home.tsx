import { Box, Divider, Stack } from "@mui/material";
import SearchBar from "./components/SearchBar";
import ClipboardList from "./components/ClipboardList";
import CreateNewButton from "./components/CreateNewButton";

function Home() {
  return (
    <>
      <Box sx={{ paddingY: 1, paddingX: { xs: 1, lg: 30 } }}>
        <Stack spacing={2} divider={<Divider orientation="horizontal" />}>
          <SearchBar />
          <ClipboardList />
        </Stack>
      </Box>
      <CreateNewButton />
    </>
  );
}

export default Home;
