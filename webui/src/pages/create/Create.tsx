import type React from "react";
import Navbar from "./components/Navbar";
import CreateClipboardStepper from "./components/CreateClipboardStepper";

const Create: React.FC = () => {
  return (
    <>
      <Navbar />
      <CreateClipboardStepper />
    </>
  );
};

export default Create;
