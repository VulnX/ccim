import { Stack } from "@mui/material";
import ClipboardEntry from "./ClipboardEntry";
import type { JSX } from "@emotion/react/jsx-runtime";

function ClipboardList() {
  const default_text = `import { Box, Button, Divider, Fab, Stack, Tooltip } from "@mui/material";
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
        <Button variant="contained" sx={{ position: 'fixed', bottom: 16, right: 16 }}> <Button variant="contained" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          Compose
        </Button>
      </Tooltip>
    </>
  );
}

export default App;`;
  const default_files = {
    "AAAA": "file1",
    "BBBB": "file2",
    "CCCC": "file3",
  };
  const clipboard_entries: JSX.Element[] = [
    <ClipboardEntry name="This is message 1" isEncypted={false} text={default_text} files={default_files} />,
    <ClipboardEntry name="This is message 2" isEncypted={false} text={default_text} files={default_files} />,
    <ClipboardEntry name="This is message 3" isEncypted={true} text={default_text} files={default_files} />,
  ]
  return (
    <Stack gap={2}>
      {
        clipboard_entries.length == 0
        ? 'No clipboards created'
        : clipboard_entries
      }
    </Stack>
  );
}

export default ClipboardList;
