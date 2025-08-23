import { TextField } from "@mui/material";
import type React from "react";

const NameStep: React.FC = () => {
  return <TextField variant="outlined" label="Name" autoFocus fullWidth />;
};

export default NameStep;
