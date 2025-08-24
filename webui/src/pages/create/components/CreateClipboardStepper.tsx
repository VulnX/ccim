import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";
import NameStep, { getRandomName } from "./steps/Name";
import AddDataStep from "./steps/AddData";
import { Paper } from "@mui/material";
import SecurityStep from "./steps/Security";
import { createClipboard, type DialogDetails } from "./util";
import CustomDialog from "./CustomDialog";

const CreateClipboardStepper: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(1);
  const [showDialog, setShowDialog] = React.useState(false);
  const [dialogDetails, setDialogDetails] =
    React.useState<DialogDetails | null>(null);

  // Persistant state variables for each step data
  const [name, setName] = React.useState(getRandomName());
  const [text, setText] = React.useState<string>("");
  const [fileList, setFileList] = React.useState<Array<File>>([]);
  const [isEncrypted, setIsEncrypted] = React.useState(false);
  const [password, setPassword] = React.useState<string>("");

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
        />
      ),
    },
    {
      label: "Additional security",
      component: (
        <SecurityStep
          isEncrypted={isEncrypted}
          setIsEncrypted={setIsEncrypted}
          password={password}
          setPassword={setPassword}
        />
      ),
    },
  ];

  const handleNext = (index: number) => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    // All steps completed: Proceed to submit form
    if (index === steps.length - 1) {
      setTimeout(async () => {
        const dialogDetails = await createClipboard(
          name,
          text,
          fileList,
          isEncrypted,
          password
        );
        setDialogDetails(dialogDetails);
        setShowDialog(true);
      }, 300);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setActiveStep(1);
  };

  return (
    <React.Fragment>
      <Paper
        sx={{
          maxWidth: {
            xs: "100%",
            lg: "70%",
          },
          marginLeft: {
            xs: "0%",
            lg: "15%",
          },
          marginY: 5,
        }}
      >
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
      </Paper>
      <CustomDialog
        showDialog={showDialog}
        closeDialog={closeDialog}
        dialogDetails={dialogDetails}
      />
    </React.Fragment>
  );
};

export default CreateClipboardStepper;
