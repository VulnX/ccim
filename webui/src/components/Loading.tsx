import { Box, CircularProgress, Typography } from "@mui/material";
import React from "react";

interface LoadingProps {
    message?: string;
    minHeight?: string | number;
    size?: number;
}

const Loading: React.FC<LoadingProps> = ({
    message = "LOADING",
    minHeight = "60vh",
    size = 50
}) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: minHeight,
                gap: 3,
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    display: "inline-flex",
                }}
            >
                <CircularProgress
                    size={size}
                    thickness={4}
                    sx={{
                        color: "#1a1a1a",
                    }}
                />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Box
                        sx={{
                            width: size * 0.2,
                            height: size * 0.2,
                            borderRadius: "50%",
                            background: "#1a1a1a",
                        }}
                    />
                </Box>
            </Box>
            {message && (
                <Typography
                    sx={{
                        color: "#666666",
                        fontSize: "1rem",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default Loading;
