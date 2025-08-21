import { IconButton, Stack, TextField } from "@mui/material"
import RefreshIcon from '@mui/icons-material/Refresh'

function SearchBar() {
    return (
        <Stack
            direction="row"
            alignItems="center"
        >
            <TextField sx={{ backgroundColor: 'white' }} fullWidth label="Search" variant="outlined" />
            <IconButton>
                <RefreshIcon sx={{ fontSize: '3rem' }} />
            </IconButton>
        </Stack>
    )
}

export default SearchBar