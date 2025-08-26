import { Stack, Typography } from "@mui/material";
import ClipboardEntry from "./ClipboardEntry";
import type { JSX } from "@emotion/react/jsx-runtime";
import type React from "react";
import { useEffect, useRef, useState } from "react";

type GetClipboardResponse = {
  name: string;
  text: string;
  file_map: { [key: string]: string };
  isEncypted: boolean;
};

const ClipboardList: React.FC = () => {
  const [clipboardEntries, setClipboardEntries] = useState<JSX.Element[]>([]);

  const hasRun = useRef(false);

  const fetchAllClipboards = async () => {
    console.log("called");
    const response = await fetch("http://localhost:8080/api/clipboards");
    const text = await response.text();
    const parsed: GetClipboardResponse[] = JSON.parse(text);
    const newClipboardEntries = parsed.map((clipboard) => {
      return (
        <ClipboardEntry
          name={clipboard.name}
          text={clipboard.text}
          file_map={clipboard.file_map}
          isEncypted={clipboard.isEncypted}
        />
      );
    });
    setClipboardEntries(newClipboardEntries);
  };

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      (async () => {
        await fetchAllClipboards();
      })();
    }
  }, []);

  return (
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
