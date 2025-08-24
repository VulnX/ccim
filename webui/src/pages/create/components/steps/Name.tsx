import { TextField } from "@mui/material";
import type React from "react";

type NameStepProps = {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
};

const NameStep: React.FC<NameStepProps> = ({ name, setName }) => {
  return (
    <TextField
      variant="outlined"
      label="Name"
      autoFocus
      fullWidth
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
};

export default NameStep;
