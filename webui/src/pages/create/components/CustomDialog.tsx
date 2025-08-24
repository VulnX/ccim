import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type React from "react";
import type { DialogDetails } from "./util";
import ErrorIcon from "@mui/icons-material/Error";

type CustomDialogProps = {
  showDialog: boolean;
  closeDialog: () => void;
  dialogDetails: DialogDetails | null;
};

const CustomDialog: React.FC<CustomDialogProps> = ({
  showDialog,
  closeDialog,
  dialogDetails,
}) => {
  return (
    <Dialog open={showDialog} fullWidth>
      <DialogContent>
        <Stack alignItems="center">
          {dialogDetails?.success ? (
            <CheckCircleIcon
              color="success"
              sx={{
                fontSize: {
                  xs: "5rem",
                  lg: "7rem",
                },
              }}
            />
          ) : (
            <ErrorIcon
              color="error"
              sx={{
                fontSize: {
                  xs: "5rem",
                  lg: "7rem",
                },
              }}
            />
          )}
          <p>{dialogDetails?.message}</p>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={closeDialog}>
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
