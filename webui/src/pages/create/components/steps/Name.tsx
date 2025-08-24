import { TextField } from "@mui/material";
import type React from "react";

type NameStepProps = {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
};

export const getRandomName = () => {
  const animals: string[] = [
    "lion",
    "tiger",
    "elephant",
    "zebra",
    "giraffe",
    "panda",
    "koala",
    "kangaroo",
    "wolf",
    "shark",
  ];

  const colors: string[] = [
    "red",
    "blue",
    "green",
    "yellow",
    "black",
    "white",
    "purplutile",
    "orange",
    "brown",
    "pink",
  ];

  const elements: string[] = [
    "hydrogen",
    "oxygen",
    "nitrogen",
    "carbon",
    "helium",
    "neon",
    "sodium",
    "iron",
    "gold",
    "silver",
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
    />
  );
};

export default NameStep;
