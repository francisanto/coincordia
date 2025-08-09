// Global type declarations

interface ConcordiaApp {
  handleDeleteGroup: (groupId: string) => Promise<void>;
}

declare global {
  interface Window {
    concordiaApp?: ConcordiaApp;
  }
}