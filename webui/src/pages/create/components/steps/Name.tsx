import { TextField } from "@mui/material";
import type React from "react";

type NameStepProps = {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
};

export const getRandomName = () => {
  const animals: string[] = [
    "eagle",
    "falcon",
    "wolf",
    "lynx",
    "panther",
    "hawk",
    "owl",
    "raven",
    "fox",
    "deer",
  ];

  const colors: string[] = [
    "black",
    "white",
    "gray",
    "silver",
    "slate",
    "charcoal",
    "ivory",
    "onyx",
    "graphite",
    "iron",
  ];

  const elements: string[] = [
    "quantum",
    "matrix",
    "nexus",
    "vector",
    "flux",
    "cipher",
    "vertex",
    "protocol",
    "core",
    "signal",
  ];

  function getRandomItem<T>(list: T[]): T {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  const randomAnimal = getRandomItem(animals);
  const randomColor = getRandomItem(colors);
  const randomElement = getRandomItem(elements);
  return `${randomColor}-${randomElement}-${randomAnimal}`;
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
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 1,
          backgroundColor: "#f9f9f9",
          "& fieldset": { borderColor: "#e0e0e0" },
          "&:hover fieldset": { borderColor: "#1a1a1a" },
          "&.Mui-focused fieldset": { borderColor: "#1a1a1a" },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: "#1a1a1a" },
      }}
    />
  );
};

export default NameStep;
