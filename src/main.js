const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
require('dotenv').config();

// Core services
const DatabaseManager = require('./database/mongodb');
const RedisManager = require('./database/redis');
const StampProcessor = require('./services/stamp-processor');
const EbayAPI = require('./api/ebay');
const WixAPI = require('./api/wix');
const ScottCatalog = require('./database/scott-catalog');
const Logger = require('./utils/logger');

class StampCollectionApp {
  constructor() {
    this.mainWindow = null;
    this.db = null;
    this.redis = null;
    this.stampProcessor = null;
    this.ebayAPI = null;
    this.wixAPI = null;
    this.scottCatalog = null;
    this.logger = new Logger();
    this.isOnline = true;
  }

  async initialize() {
    try {
      this.logger.info('Initializing Stamp Collection App...');
      
      // Initialize database connections
      this.db = new DatabaseManager();
      await this.db.connect();
      
      this.redis = new RedisManager();
      await this.redis.connect();
      
      // Initialize Scott Catalog
      this.scottCatalog = new ScottCatalog(this.db);
      await this.scottCatalog.initialize();
      
      // Initialize APIs
      this.ebayAPI = new EbayAPI();
      this.wixAPI = new WixAPI();
      
      // Initialize stamp processor
      this.stampProcessor = new StampProcessor(this.db, this.redis, this.scottCatalog);
      
      // Create main window
      this.createMainWindow();
      
      // Set up IPC handlers
      this.setupIpcHandlers();
      
      // Set up application menu
      this.setupApplicationMenu();
      
      this.logger.info('App initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize app:', error);
      this.showErrorDialog('Initialization Error', 'Failed to start the application. Please check your database connections.');
    }
  }

  createMainWindow() {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      },
      icon: path.join(__dirname, '../assets/icon.ico'),
      title: 'Stamp Collection Intelligence Platform',
      show: false // Don't show until ready
    });

    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../renderer/build/index.html')}`;
    
    this.mainWindow.loadURL(startUrl);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  setupApplicationMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Stamp',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('menu-new-stamp');
            }
          },
          {
            label: 'Import Scott Catalog',
            click: async () => {
              await this.importScottCatalog();
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'eBay Settings',
            click: () => {
              this.mainWindow.webContents.send('open-ebay-settings');
            }
          },
          {
            label: 'Wix Settings',
            click: () => {
              this.mainWindow.webContents.send('open-wix-settings');
            }
          },
          { type: 'separator' },
          {
            label: 'Database Status',
            click: async () => {
              const status = await this.getDatabaseStatus();
              this.mainWindow.webContents.send('show-database-status', status);
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              this.showAboutDialog();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIpcHandlers() {
    // Stamp submission
    ipcMain.handle('submit-stamp', async (event, stampData) => {
      try {
        this.logger.info('Processing stamp submission:', stampData.name);
        const result = await this.stampProcessor.processStampSubmission(stampData);
        return { success: true, data: result };
      } catch (error) {
        this.logger.error('Stamp submission failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Get stamps
    ipcMain.handle('get-stamps', async (event, filters = {}) => {
      try {
        const stamps = await this.db.getStamps(filters);
        return { success: true, data: stamps };
      } catch (error) {
        this.logger.error('Get stamps failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Scott Catalog lookup
    ipcMain.handle('lookup-scott-catalog', async (event, stampData) => {
      try {
        const result = await this.scottCatalog.lookupStamp(stampData);
        return { success: true, data: result };
      } catch (error) {
        this.logger.error('Scott catalog lookup failed:', error);
        return { success: false, error: error.message };
      }
    });

    // eBay integration
    ipcMain.handle('publish-to-ebay', async (event, stampUuid) => {
      try {
        const result = await this.ebayAPI.createListing(stampUuid);
        return { success: true, data: result };
      } catch (error) {
        this.logger.error('eBay publish failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Wix integration
    ipcMain.handle('publish-to-wix', async (event, stampUuid) => {
      try {
        const result = await this.wixAPI.publishToCollection(stampUuid);
        return { success: true, data: result };
      } catch (error) {
        this.logger.error('Wix publish failed:', error);
        return { success: false, error: error.message };
      }
    });

    // File dialogs
    ipcMain.handle('show-open-dialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });

    // App settings
    ipcMain.handle('save-settings', async (event, settings) => {
      try {
        await this.db.saveSettings(settings);
        return { success: true };
      } catch (error) {
        this.logger.error('Save settings failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-settings', async () => {
      try {
        const settings = await this.db.getSettings();
        return { success: true, data: settings };
      } catch (error) {
        this.logger.error('Get settings failed:', error);
        return { success: false, error: error.message };
      }
    });
  }

  async importScottCatalog() {
    try {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        title: 'Import Scott Catalog Data',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        this.logger.info('Importing Scott Catalog from:', filePath);
        
        await this.scottCatalog.importFromFile(filePath);
        
        this.showInfoDialog('Import Complete', 'Scott Catalog data has been imported successfully.');
      }
    } catch (error) {
      this.logger.error('Scott Catalog import failed:', error);
      this.showErrorDialog('Import Failed', 'Failed to import Scott Catalog data: ' + error.message);
    }
  }

  async getDatabaseStatus() {
    try {
      const mongoStatus = await this.db.getStatus();
      const redisStatus = await this.redis.getStatus();
      
      return {
        mongodb: mongoStatus,
        redis: redisStatus,
        scottCatalog: await this.scottCatalog.getStatus()
      };
    } catch (error) {
      this.logger.error('Get database status failed:', error);
      return { error: error.message };
    }
  }

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Stamp Collection Intelligence',
      message: 'Stamp Collection Intelligence Platform',
      detail: 'Version 1.0.0\n\nAI-powered stamp collection management with eBay and Wix integration.\n\n© 2025 WPP Ecommerce Tool'
    });
  }

  showErrorDialog(title, message) {
    dialog.showErrorBox(title, message);
  }

  showInfoDialog(title, message) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title,
      message
    });
  }

  async cleanup() {
    try {
      this.logger.info('Cleaning up resources...');
      
      if (this.db) {
        await this.db.disconnect();
      }
      
      if (this.redis) {
        await this.redis.disconnect();
      }
      
      this.logger.info('Cleanup complete');
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }
}

// App event handlers
const stampApp = new StampCollectionApp();

app.whenReady().then(async () => {
  await stampApp.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await stampApp.initialize();
  }
});

app.on('before-quit', async () => {
  await stampApp.cleanup();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  stampApp.logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  stampApp.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});
