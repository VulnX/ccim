import React from "react";
import CreateClipboardStepper from "./components/CreateClipboardStepper";
import { Box, LinearProgress, Paper, Tab, Tabs } from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import SettingsIcon from "@mui/icons-material/Settings";
import { getRandomName } from "./components/steps/Name";
import SettingsStep from "./components/steps/Settings";
import { createClipboard, type DialogDetails } from "./components/util";
import CustomDialog from "./components/CustomDialog";
import { useClipboard } from "../../context/ClipboardContext";

const Create: React.FC = () => {
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
  const { fetchClipboards } = useClipboard()!;

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
    setActiveStep(1);
    fetchClipboards();
  };

  return (
    <>
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
            elevation={0}
            sx={{
              marginY: 5,
              paddingX: { xs: 0, lg: 5 },
              paddingY: { xs: 0, lg: 1 },
              background: "#ffffff",
              borderRadius: 1,
              border: "1px solid #e0e0e0",
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="inherit"
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  color: "#666666",
                  "& .MuiSvgIcon-root": {
                    color: "#666666",
                  },
                },
                "& .Mui-selected": {
                  color: "#1a1a1a !important",
                  "& .MuiSvgIcon-root": {
                    color: "#1a1a1a !important",
                  },
                },
                "& .MuiTabs-indicator": {
                  background: "#1a1a1a", // Pure Black Theme
                  height: 3,
                },
              }}
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
                maxWidth: { xs: "90%", lg: "100%" },
                marginLeft: { xs: "5%", lg: "0%" },
                height: 4,
                borderRadius: 1,
                background: "#f5f5f5",
                "& .MuiLinearProgress-bar": {
                  background: "#1a1a1a",
                  borderRadius: 1,
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
