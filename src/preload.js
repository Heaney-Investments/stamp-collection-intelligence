const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Stamp operations
  submitStamp: (stampData) => ipcRenderer.invoke('submit-stamp', stampData),
  getStamps: (filters) => ipcRenderer.invoke('get-stamps', filters),
  
  // Scott Catalog operations
  lookupScottCatalog: (stampData) => ipcRenderer.invoke('lookup-scott-catalog', stampData),
  
  // Platform integrations
  publishToEbay: (stampUuid) => ipcRenderer.invoke('publish-to-ebay', stampUuid),
  publishToWix: (stampUuid) => ipcRenderer.invoke('publish-to-wix', stampUuid),
  
  // File operations
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Settings
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  
  // Menu events
  onMenuNewStamp: (callback) => ipcRenderer.on('menu-new-stamp', callback),
  onOpenEbaySettings: (callback) => ipcRenderer.on('open-ebay-settings', callback),
  onOpenWixSettings: (callback) => ipcRenderer.on('open-wix-settings', callback),
  onShowDatabaseStatus: (callback) => ipcRenderer.on('show-database-status', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose some useful utilities
contextBridge.exposeInMainWorld('utils', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
