import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import NameStep from "./steps/Name";
import AddDataStep from "./steps/AddData";
import { Paper } from "@mui/material";
import SecurityStep from "./steps/Security";

const steps = [
  {
    label: "Choose a name",
    component: <NameStep />,
  },
  {
    label: "Add data",
    component: <AddDataStep />,
  },
  {
    label: "Additional security",
    component: <SecurityStep />,
  },
];

const CreateClipboardStepper: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Paper sx={{ maxWidth: "70%", marginLeft: "15%" }}>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{ marginX: 3, paddingY: 3 }}
      >
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              optional={
                index === steps.length - 1 ? (
                  <Typography variant="caption" fontStyle="italic">
                    (Optional)
                  </Typography>
                ) : null
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              {step.component}
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
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
    </Paper>
  );
};

export default CreateClipboardStepper;
