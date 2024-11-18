// frontend/global.d.ts
export {};

declare global {
  interface Window {
    electron: {
      runCommand: (args: string[]) => Promise<string>;
      getFilePath: (fileName: string) => Promise<string>;
      openFileDialog: () => Promise<string | null>;
      onCommandOutput: (callback: (output: string) => void) => void;
      getAppDataPath: () => Promise<string>;
    };
  }
}
