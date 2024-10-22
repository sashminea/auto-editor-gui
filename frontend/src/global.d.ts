// src/global.d.ts or src/electron.d.ts
declare global {
    interface Window {
        electron: {
            runCommand: (command: string) => Promise<string>;
        };
    }
}

export {};