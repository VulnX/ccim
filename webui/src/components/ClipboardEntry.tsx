import { Box, Button, Collapse, Divider, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import type React from "react";
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

type ClipboardEntryProps = {
  name: string;
  isEncypted: boolean;
  text: string;
  files: { [key: string]: string };
};

const ClipboardEntry: React.FC<ClipboardEntryProps> = ({
  name,
  isEncypted,
  text = `import { Box, Button, Divider, Fab, Stack, Tooltip } from "@mui/material";
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

export default App;`,
  files = {
    "AAAA": "file1",
    "BBBB": "file2",
    "CCCC": "file3",
  },
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Paper elevation={2} sx={{ padding: "16px", "&:hover": { boxShadow: 4 }, }}>
      <Stack sx={{ cursor: "pointer" }} direction="row" justifyContent="space-between" onClick={handleToggleExpand} >
        <Stack direction="row" alignItems={"center"}>
          {isExpanded ? <KeyboardArrowDownRoundedIcon /> : <KeyboardArrowRightRoundedIcon />}
          <Typography marginLeft={1}>{name}</Typography>
        </Stack>
        <Tooltip title={isExpanded ? "Edit" : isEncypted ? "Private" : "Public"}>
          <IconButton disableRipple={!isExpanded} onClick={e => e.stopPropagation()}>
            {isExpanded ? (<EditIcon />) : isEncypted ? (
              <LockIcon color="error" />
            ) : (
              <PublicIcon color="info" />
            )}
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: -10,
              left: 10,
              backgroundColor: 'white',
              px: 0.5,
              color: 'primary.main',
              fontSize: '0.8rem',
            }}
          >Text</Typography>
          <Box
            component="pre"
            sx={{
              fontFamily: 'monospace',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              p: 2,
              overflowX: 'auto',
            }}
          >
            {text}
          </Box>
        </Box>
        <Divider />
        <Typography variant="h5" marginTop={2}>Files</Typography>
        <Stack gap={2} marginTop={2}>
          {
            Object.entries(files).map(([fileId, fileName]) => {
              return <Button
                key={fileId}
                fullWidth
                sx={{ justifyContent: 'start', textTransform: 'none' }}
                variant="outlined"
              >{fileName}</Button>
            })
          }
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default ClipboardEntry;
