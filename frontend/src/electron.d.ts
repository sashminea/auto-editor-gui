// Replace any existing declaration of window.electron with this one
export {};

declare global {
  interface Window {
    electron: {
      runCommand: (args: string[]) => Promise<string>;
      cancelCommand: () => Promise<boolean>;
      getAppDataPath: () => Promise<string>;
      openFileDialog: () => Promise<string | null>;
      openFolderDialog: () => Promise<string | null>;
      getOutputDir: () => Promise<string>;
      chooseOutputDir: () => Promise<string | null>;
      revealPath: (path: string) => Promise<boolean>;
      checkRuntime: () => Promise<{ ok: boolean; detail: string }>;
      onCommandOutput: (callback: (output: string) => void) => () => void;
      setTitleBarTheme: (theme: string) => void;
      getPathForFile: (file: File) => string;
      platform: string;
    };
  }
}
