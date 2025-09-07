import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import type React from "react";
import { useParams } from "react-router-dom";
import type { GetClipboardResponse } from "../../util/types";

type ClipProps = {
  clipboardList: GetClipboardResponse[];
};

const Clip: React.FC<ClipProps> = ({ clipboardList }) => {
  const { clipboardName } = useParams();
  const clipboard = clipboardList.find((clip) => clip.name === clipboardName);
  if (!clipboard) {
    return <h1>NOT FOUND</h1>;
  }
  const text = String.fromCharCode(...clipboard.text);

  const downloadFile = (fileName: string, fileId: string) => {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = `/api/clipboards/file/${fileId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        justifySelf: "center",
        width: {
          xs: "90vw",
          md: "75%",
        },
        padding: 2,
        marginTop: 5,
      }}
    >
      <Stack>
        <Button
          variant="contained"
          size="small"
          color="error"
          sx={{
            alignSelf: "flex-end",
          }}
        >
          Delete
        </Button>
      </Stack>
      <Typography variant="h4">{clipboard.name}</Typography>
      <Divider sx={{ marginBottom: 5 }} />
      <Box sx={{ position: "relative", marginBottom: 2 }}>
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: -10,
            left: 10,
            backgroundColor: "white",
            paddingX: 0.5,
            color: "primary.main",
            fontSize: "0.8rem",
          }}
        >
          Text
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: "monospace",
            border: "1px solid",
            borderColor: "primary.main",
            borderRadius: 1,
            padding: 2,
            overflowX: "auto",
            fontSize: "small",
          }}
        >
          {text}
        </Box>
      </Box>
      <Divider />
      <Typography variant="h5" marginTop={2} marginBottom={-1}>
        Files
      </Typography>
      <Stack gap={2} marginTop={2}>
        {Object.entries(clipboard.file_map).map(([fileName, fileId]) => {
          return (
            <Button
              key={fileId}
              fullWidth
              onClick={() => downloadFile(fileName, fileId)}
              sx={{
                justifyContent: "start",
                textTransform: "none",
                textAlign: "left",
                wordBreak: "break-word",
              }}
              variant="outlined"
            >
              {fileName}
            </Button>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default Clip;
