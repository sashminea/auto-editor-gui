export {};

declare global {
  interface Window {
    electron: {
      runCommand: (args: string[]) => Promise<string | { success: boolean; message?: string }>;
      openFileDialog: () => Promise<string | null>;
      openFolderDialog: () => Promise<string | null>;
      onCommandOutput: (callback: (output: string) => void) => void;
      getAppDataPath: () => Promise<string>;
    };
  }
}
