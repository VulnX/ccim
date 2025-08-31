import { LinearProgress, Stack, Typography } from "@mui/material";
import ClipboardEntry from "./ClipboardEntry";
import type { JSX } from "@emotion/react/jsx-runtime";
import React from "react";

type GetClipboardResponse = {
  name: string;
  text: string;
  file_map: { [key: string]: string };
  isEncypted: boolean;
  expiry: number;
};

const ClipboardList: React.FC = () => {
  const [clipboardEntries, setClipboardEntries] = React.useState<JSX.Element[]>(
    [],
  );
  const [showProgressbar, setShowProgressbar] = React.useState(true);

  const hasRun = React.useRef(false);

  const fetchAllClipboards = async () => {
    setShowProgressbar(true);
    const response = await fetch("/api/clipboards");
    setShowProgressbar(false);
    if (response.status === 204) {
      setClipboardEntries([]);
      return;
    }
    if (response.status !== 200) {
      console.error("Failed to get all clipboards");
      return;
    }
    const text = await response.text();
    const parsed: GetClipboardResponse[] = JSON.parse(text);
    const newClipboardEntries = parsed.map((clipboard, idx) => {
      return (
        <ClipboardEntry
          key={idx}
          name={clipboard.name}
          text={clipboard.text}
          file_map={clipboard.file_map}
          isEncypted={clipboard.isEncypted}
          expiry={clipboard.expiry}
          reload={fetchAllClipboards}
        />
      );
    });
    setClipboardEntries(newClipboardEntries);
  };

  React.useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      (async () => {
        await fetchAllClipboards();
      })();
    }
  }, []);

  return showProgressbar ? (
    <LinearProgress />
  ) : (
    <Stack gap={2}>
      {clipboardEntries.length == 0 ? (
        <Typography textAlign="center">No clipboards available</Typography>
      ) : (
        clipboardEntries
      )}
    </Stack>
  );
};

export default ClipboardList;
