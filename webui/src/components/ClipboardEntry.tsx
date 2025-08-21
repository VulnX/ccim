import { Box, Paper, Typography } from "@mui/material"
import PublicIcon from '@mui/icons-material/Public'
import LockIcon from '@mui/icons-material/Lock'
import type React from "react";

type ClipboardEntryProps = {
    message: string;
    isEncypted: boolean;
}

const ClipboardEntry: React.FC<ClipboardEntryProps> = ({ message, isEncypted }) => {
    return (
        <Paper
            sx={{ padding: '16px' }}
        >
            <Box
                display="flex"
                justifyContent="space-between"
            >
                <Typography>{message}</Typography>
                {
                    isEncypted ? <LockIcon /> : <PublicIcon />
                }
            </Box>
        </Paper>
    )
}

export default ClipboardEntry