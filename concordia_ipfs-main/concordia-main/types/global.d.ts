// Global type declarations

interface ConcordiaApp {
  handleDeleteGroup?: (groupId: string) => Promise<void>;
  disconnect?: () => void;
  [key: string]: any;
}

declare global {
  interface Window {
    concordiaApp?: ConcordiaApp;
    ethereum?: any;
  }
}