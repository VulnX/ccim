import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useClipboard } from "../../context/ClipboardContext";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import DescriptionIcon from "@mui/icons-material/Description";
import AutoDeleteIcon from "@mui/icons-material/AutoDelete";

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <Paper
    elevation={0}
    sx={{
      p: 4,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      textAlign: "left",
      border: "1px solid #e0e0e0",
      borderRadius: 1,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#1a1a1a",
      },
    }}
  >
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        backgroundColor: "#f5f5f5",
        color: "#1a1a1a",
        mb: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="h6"
      gutterBottom
      sx={{ fontWeight: 700, color: "#1a1a1a" }}
    >
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
      {description}
    </Typography>
  </Paper>
);

function Home() {
  const navigate = useNavigate();
  const { clipboardList } = useClipboard()!;

  return (
    <Box sx={{ background: "#ffffff", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          backgroundColor: "#f9f9f9",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.5rem", md: "4rem" },
              fontWeight: 800,
              color: "#1a1a1a",
              mb: 2,
              letterSpacing: "-0.02em",
            }}
          >
            CCIM
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.2rem", md: "1.6rem" },
              fontWeight: 500,
              color: "#1a1a1a",
              mb: 3,
            }}
          >
            A high-performance, self-hostable, shared clipboard.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: "1.1rem",
              color: "#666666",
              mb: 5,
              maxWidth: "600px",
              lineHeight: 1.7,
            }}
          >
            Fast, secure, and reliable data transfer across devices. Built for
            security and minimalist utility.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              disableElevation
              onClick={() => navigate("/create")}
              sx={{
                px: 5,
                py: 1.5,
                background: "#1a1a1a",
                color: "white",
                borderRadius: 1,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  background: "#000000",
                },
              }}
            >
              Get Started
            </Button>
            {clipboardList.length > 0 && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(`/clip/${clipboardList[0].name}`)}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderColor: "#e0e0e0",
                  color: "#1a1a1a",
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#1a1a1a",
                    backgroundColor: "transparent",
                  },
                }}
              >
                View Clipboards
              </Button>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 800, mb: 6, color: "#1a1a1a", textAlign: "left" }}
        >
          Capabilities
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<SecurityIcon />}
              title="Secure"
              description="End-to-end encryption ensures your data stays private and secure. Password-protected access for every clipboard."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<SpeedIcon />}
              title="Fast"
              description="Share instantly across devices with zero-latency synchronization. Your data is available as soon as it is sent."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<DescriptionIcon />}
              title="Versatile"
              description="Share files of any type alongside text. Organize your shared content efficiently in a unified interface."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<AutoDeleteIcon />}
              title="Auto-Expiry"
              description="Clipboards automatically expire after your chosen time. Keep your cloud clean and temporary."
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Home;
