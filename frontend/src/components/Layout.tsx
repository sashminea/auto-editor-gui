import React, { useState, useEffect } from 'react';
import NavigationMenuDemo from './NavBar';
import ExportXML from './ExportXML';
import CommandDisplay from './CommandDisplay';
import { Alert } from './ui/alert';
import AlertComponent from './Alert';

interface SelectedFile {
  name: string;
  path: string;
}

const Layout: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [exportPath, setExportPath] = useState<string>('\\output');
  const [exportAs, setExportAs] = useState<string>('premiere');
  const [loudness, setLoudness] = useState<number>(-19);
  const [margin, setMargin] = useState<number>(0);
  const [command, setCommand] = useState<string>('');
  
  // State to hold the alert message and type
  const [alert, setAlert] = useState<{ message: string, type: 'normal' | 'error' | 'success' | null } | null>(null);

  const showNormalAlert = (message: string) => setAlert({ message, type: 'normal' });
  const showErrorAlert = (message: string) => setAlert({ message, type: 'error' });
  const showSuccessAlert = (message: string) => setAlert({ message, type: 'success' });
  const dismissAlert = () => setAlert(null);

  // Fetch AppData path when the component mounts
  useEffect(() => {
    const fetchAppDataPath = async () => {
      try {
        const appDataPath = await window.electron.getAppDataPath();
        setExportPath(`${appDataPath}\\Auto Editor Output`);
      } catch (error) {
        console.error("Failed to get AppData path:", error);
      }
    };

    fetchAppDataPath();
  }, []);

  return (
    <div className="flex flex-col container gap-4">
      <NavigationMenuDemo />
      {alert && <AlertComponent type={alert.type!} message={alert.message} onDismiss={dismissAlert} />}
      <ExportXML onFileSelect={setSelectedFile} onCommandChange={setCommand} onExportPathChange={setExportPath} setAlert={setAlert} />
      <CommandDisplay selectedFile={selectedFile} exportPath={exportPath} exportAs={exportAs} loudness={loudness} margin={margin} command={command} />
    </div>
  );
};

export default Layout;