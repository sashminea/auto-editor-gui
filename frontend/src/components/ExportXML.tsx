import React from 'react';
import { Button } from "@/components/ui/button"


// Define a functional component
const ExportXML: React.FC = () => {
    // Async function to run the auto-editor command
    const runAutoEditor = async (): Promise<void> => {
        try {
            const command: string = 'auto-editor example.mp4 --export premiere'; // Replace with your command
            const result: string = await window.electron.runCommand(command);
            console.log(result); // Log the result or update the UI accordingly
        } catch (error) {
            console.error(error); // Handle error gracefully
        }
    };

    // Return JSX element explicitly typed
    return (
        <div className="">
            <Button onClick={runAutoEditor}>
                Export for Premiere
            </Button>
        </div>
    );
};

export default ExportXML;

