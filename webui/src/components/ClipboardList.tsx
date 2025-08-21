import { Stack } from "@mui/material"
import ClipboardEntry from "./ClipboardEntry"

function ClipboardList() {
    return (
        <Stack
            gap={3}
        >
            <ClipboardEntry message="this is message 1" isEncypted={false} />
            <ClipboardEntry message="this is message 2" isEncypted={false} />
            <ClipboardEntry message="this is message 3" isEncypted={true} />
        </Stack>
    )
}

export default ClipboardList