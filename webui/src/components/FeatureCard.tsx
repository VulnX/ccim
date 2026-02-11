import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        background: "#ffffff",
        borderRadius: 1,
        border: "1px solid #e0e0e0",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#1a1a1a",
          background: "#f9f9f9",
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 50,
            height: 50,
            borderRadius: 1,
            background: "#f5f5f5",
            mb: 3,
            color: "#1a1a1a",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: "#1a1a1a",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#666666",
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
