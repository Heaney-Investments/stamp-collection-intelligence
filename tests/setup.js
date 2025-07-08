// Jest setup for main process tests
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/tmp'),
    getVersion: jest.fn().mockReturnValue('1.0.0'),
    quit: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn().mockResolvedValue(undefined),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    on: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn(),
      setWindowOpenHandler: jest.fn(),
    },
    show: jest.fn(),
    close: jest.fn(),
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
    showErrorBox: jest.fn(),
  },
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
}));

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

global.console = {
  ...console,
  // Suppress console logs in tests unless debugging
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};
