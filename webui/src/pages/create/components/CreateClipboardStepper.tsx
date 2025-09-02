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
    <Stepper activeStep={activeStep} orientation="vertical">
      {steps.map((step, index) => (
        <Step key={step.label}>
          <StepLabel>{step.label}</StepLabel>
          <StepContent>
            {step.component}
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleNext(index)}
                sx={{ mt: 1, mr: 1 }}
              >
                {index === steps.length - 1 ? "Create" : "Next"}
              </Button>
              <Button
                disabled={index === 0}
                onClick={handleBack}
                sx={{ mt: 1, mr: 1 }}
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
