// Jest setup for renderer process tests
import '@testing-library/jest-dom';

// Mock window.electronAPI
global.window.electronAPI = {
  submitStamp: jest.fn(),
  getStamps: jest.fn(),
  saveSettings: jest.fn(),
  getSettings: jest.fn(),
  showOpenDialog: jest.fn(),
  onMenuNewStamp: jest.fn(),
  onOpenEbaySettings: jest.fn(),
  onOpenWixSettings: jest.fn(),
  onShowDatabaseStatus: jest.fn(),
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock File and FileReader for file upload tests
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,mockbase64data`;
      this.readyState = 2;
      if (this.onload) this.onload();
    }, 0);
  }

  readAsText(file) {
    setTimeout(() => {
      this.result = 'mock file content';
      this.readyState = 2;
      if (this.onload) this.onload();
    }, 0);
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Suppress console logs in tests
global.console = {
  ...console,
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};
