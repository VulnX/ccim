import { Stack } from "@mui/material";
import ClipboardEntry from "./ClipboardEntry";

function ClipboardList() {
  return (
    <Stack gap={2}>
      <ClipboardEntry name="This is message 1" isEncypted={false} />
      <ClipboardEntry name="This is message 2" isEncypted={false} />
      <ClipboardEntry name="This is message 3" isEncypted={true} />
    </Stack>
  );
}

export default ClipboardList;
