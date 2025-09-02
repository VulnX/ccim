import React from "react";
import Navbar from "./components/Navbar";
import CreateClipboardStepper from "./components/CreateClipboardStepper";
import { Box, LinearProgress, Paper, Tab, Tabs } from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import SettingsIcon from "@mui/icons-material/Settings";
import { getRandomName } from "./components/steps/Name";
import SettingsStep from "./components/steps/Settings";
import { createClipboard, type DialogDetails } from "./components/util";
import CustomDialog from "./components/CustomDialog";
import { useNavigate } from "react-router-dom";

const Create: React.FC = () => {
  const nagivate = useNavigate();
  const [progress, setProgress] = React.useState<null | number>(null);
  const [currentTab, setCurrentTab] = React.useState("clipboard");
  const [showDialog, setShowDialog] = React.useState(false);

  // Persistant state variables for each tab and step data
  const [name, setName] = React.useState(getRandomName());
  const [text, setText] = React.useState<string>("");
  const [fileList, setFileList] = React.useState<Array<File>>([]);
  const [expiry, setExpiry] = React.useState(5 * 60);
  const [isEncrypted, setIsEncrypted] = React.useState(false);
  const [password, setPassword] = React.useState<string>("");
  const [dialogDetails, setDialogDetails] =
    React.useState<DialogDetails | null>(null);
  const [activeStep, setActiveStep] = React.useState(1);
  const [currentStepperTab, setCurrentStepperTab] = React.useState("text");

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: string,
  ): void => {
    setCurrentTab(newValue);
  };

  const handleCreateClipboard = (): void => {
    setTimeout(async () => {
      const dialogDetails = await createClipboard(
        setProgress,
        name,
        text,
        fileList,
        expiry,
        isEncrypted,
        password,
      );
      setDialogDetails(dialogDetails);
      setShowDialog(true);
    }, 300);
  };

  const closeDialog = (): void => {
    setShowDialog(false);
    if (dialogDetails?.success) {
      nagivate(-1);
    } else {
      setActiveStep(1);
    }
  };

  return (
    <>
      <Navbar />
      <React.Fragment>
        <Box
          sx={{
            maxWidth: {
              xs: "100%",
              lg: "70%",
            },
            marginLeft: {
              xs: "0%",
              lg: "15%",
            },
          }}
        >
          <Paper
            sx={{
              marginY: 5,
              paddingX: {
                xs: 0,
                lg: 5,
              },
              paddingY: {
                xs: 0,
                lg: 1,
              },
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab
                value="clipboard"
                label="Clipboard"
                icon={<ContentPasteIcon fontSize="small" />}
                iconPosition="start"
              />
              <Tab
                value="settings"
                label="Settings"
                icon={<SettingsIcon fontSize="small" />}
                iconPosition="start"
              />
            </Tabs>

            <Box
              sx={{
                paddingX: 3,
                paddingY: 3,
              }}
            >
              {currentTab === "clipboard" && (
                <CreateClipboardStepper
                  name={name}
                  setName={setName}
                  text={text}
                  setText={setText}
                  fileList={fileList}
                  setFileList={setFileList}
                  handleCreateClipboard={handleCreateClipboard}
                  activeStep={activeStep}
                  setActiveStep={setActiveStep}
                  currentStepperTab={currentStepperTab}
                  setCurrentStepperTab={setCurrentStepperTab}
                />
              )}
              {currentTab === "settings" && (
                <SettingsStep
                  expiry={expiry}
                  setExpiry={setExpiry}
                  isEncrypted={isEncrypted}
                  setIsEncrypted={setIsEncrypted}
                  password={password}
                  setPassword={setPassword}
                />
              )}
            </Box>
          </Paper>

          {progress !== null && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                maxWidth: {
                  xs: "90%",
                  lg: "100%",
                },
                marginLeft: {
                  xs: "5%",
                  lg: "0%",
                },
              }}
            />
          )}
        </Box>
        <CustomDialog
          showDialog={showDialog}
          closeDialog={closeDialog}
          dialogDetails={dialogDetails}
        />
      </React.Fragment>
    </>
  );
};

export default Create;
