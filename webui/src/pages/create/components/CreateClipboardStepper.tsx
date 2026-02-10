import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import React from "react";
import NameStep from "./steps/Name";
import AddDataStep from "./steps/AddData";

type CreateClipboardStepperProps = {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  fileList: File[];
  setFileList: React.Dispatch<React.SetStateAction<File[]>>;
  handleCreateClipboard: () => void;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  currentStepperTab: string;
  setCurrentStepperTab: React.Dispatch<React.SetStateAction<string>>;
};

const CreateClipboardStepper: React.FC<CreateClipboardStepperProps> = ({
  name,
  setName,
  text,
  setText,
  fileList,
  setFileList,
  handleCreateClipboard,
  activeStep,
  setActiveStep,
  currentStepperTab,
  setCurrentStepperTab,
}) => {
  const steps = [
    {
      label: "Choose a name",
      component: <NameStep name={name} setName={setName} />,
    },
    {
      label: "Add data",
      component: (
        <AddDataStep
          text={text}
          setText={setText}
          fileList={fileList}
          setFileList={setFileList}
          currentTab={currentStepperTab}
          setCurrentTab={setCurrentStepperTab}
        />
      ),
    },
  ];

  const handleNext = (index: number) => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    // All steps completed: Proceed to submit form
    if (index === steps.length - 1) {
      handleCreateClipboard();
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Stepper
      activeStep={activeStep}
      orientation="vertical"
      sx={{
        "& .MuiStepLabel-label": {
          fontWeight: 600,
          color: "#666666",
          fontSize: "1rem",
        },
        "& .MuiStepLabel-label.Mui-active": {
          color: "#1a1a1a",
          fontWeight: 700,
        },
        "& .MuiStepIcon-root.Mui-active": {
          color: "#1a1a1a", // Pure Black Theme
        },
        "& .MuiStepIcon-root.Mui-completed": {
          color: "#1a1a1a", // Pure Black Theme
        },
        "& .MuiStepContent-root": {
          borderLeft: "1px solid #e0e0e0",
          marginLeft: "12px",
          paddingLeft: "30px",
        },
      }}
    >
      {steps.map((step, index) => (
        <Step key={step.label}>
          <StepLabel>{step.label}</StepLabel>
          <StepContent>
            <Box sx={{ py: 1 }}>{step.component}</Box>
            <Box sx={{ mb: 2, mt: 2, display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                disableElevation
                onClick={() => handleNext(index)}
                sx={{
                  borderRadius: 1,
                  background: "#1a1a1a",
                  color: "white",
                  transition: "all 0.2s ease",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 4,
                  "&:hover": {
                    background: "#000000",
                  },
                }}
              >
                {index === steps.length - 1 ? "Create" : "Next"}
              </Button>
              <Button
                disabled={index === 0}
                onClick={handleBack}
                sx={{
                  textTransform: "none",
                  color: "#666666",
                  fontWeight: 500,
                  px: 2,
                  "&:hover": {
                    color: "#1a1a1a",
                    backgroundColor: "transparent",
                  },
                }}
              >
                Back
              </Button>
            </Box>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );
};

export default CreateClipboardStepper;
