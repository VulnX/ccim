import { IconButton, Stack, TextField, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

function SearchBar() {
  return (
    <Stack
      direction="row"
      sx={{
        gap: {
          xs: 1,
          lg: 3,
        },
      }}
    >
      <TextField
        fullWidth
        label="Search"
        variant="outlined"
      />
      <Tooltip title="Reload">
        <IconButton>
          <RefreshIcon sx={{ fontSize: "3rem" }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default SearchBar;
