import { Box, Button, Tab, Tabs, TextField } from "@mui/material";
import React from "react";

const AddDataStep: React.FC = () => {
    const [value, setValue] = React.useState('text');

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    return (
        <>
            <Tabs
                value={value}
                onChange={handleChange}
            >
                <Tab value='text' label='Text' />
                <Tab value='files' label='Files' />
            </Tabs>

            <Box sx={{ marginTop: 2 }}>
                {value === 'text' && (
                    <TextField
                        label='Paste text here'
                        fullWidth
                        multiline
                    />
                )}

                {value === 'files' && (
                    <Button variant="outlined" fullWidth>Select files</Button>
                )}
            </Box>
        </>
    )
};

export default AddDataStep;