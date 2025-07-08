const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const DatabaseManager = require('./database/mongodb');
const { Logger } = require('./utils/logger');

class StampCollectionServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.dbManager = new DatabaseManager();
    this.logger = new Logger();
    this.uploadsDir = path.join(__dirname, '../uploads');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Static file serving
    this.app.use('/uploads', express.static(this.uploadsDir));
    this.app.use('/static', express.static(path.join(__dirname, '../public')));

    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    // Multer configuration for file uploads
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const userDir = path.join(this.uploadsDir, req.body.user_uuid || 'temp');
          if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
          }
          cb(null, userDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}-${file.originalname}`;
          cb(null, uniqueName);
        }
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Maximum 10 files per upload
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const dbStatus = await this.dbManager.getStatus();
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: dbStatus,
          version: process.env.npm_package_version || '1.0.0'
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    });

    // API routes
    this.app.use('/api/stamps', this.createStampRoutes());
    this.app.use('/api/settings', this.createSettingsRoutes());
    this.app.use('/api/upload', this.createUploadRoutes());
    this.app.use('/api/scott', this.createScottRoutes());
    this.app.use('/api/market', this.createMarketRoutes());
    this.app.use('/api/search', this.createSearchRoutes());

    // Serve frontend (if built)
    const frontendPath = path.join(__dirname, '../build');
    if (fs.existsSync(frontendPath)) {
      this.app.use(express.static(frontendPath));
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
      });
    }
  }

  createStampRoutes() {
    const router = express.Router();

    // Get all stamps for a user
    router.get('/', async (req, res) => {
      try {
        const { user_uuid, status, limit } = req.query;
        const filters = {
          user_uuid,
          processing_status: status,
          limit: parseInt(limit) || 100
        };

        const stamps = await this.dbManager.getStamps(filters);
        res.json({ stamps, count: stamps.length });
      } catch (error) {
        this.logger.error('Failed to get stamps', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get single stamp by UUID
    router.get('/:stampUuid', async (req, res) => {
      try {
        const stamp = await this.dbManager.getStampByUuid(req.params.stampUuid);
        if (!stamp) {
          return res.status(404).json({ error: 'Stamp not found' });
        }
        res.json(stamp);
      } catch (error) {
        this.logger.error('Failed to get stamp', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Create new stamp
    router.post('/', async (req, res) => {
      try {
        const stampData = {
          user_uuid: req.body.user_uuid || 'default-user',
          user_input: {
            name: req.body.name,
            price: parseFloat(req.body.price) || 0,
            auction_enabled: req.body.auction_enabled === 'true',
            photos: req.body.photos || []
          }
        };

        const savedStamp = await this.dbManager.saveStamp(stampData);
        this.logger.info('Stamp created', { stampUuid: savedStamp.stamp_uuid });
        
        res.status(201).json({
          message: 'Stamp created successfully',
          stamp: savedStamp
        });
      } catch (error) {
        this.logger.error('Failed to create stamp', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Update stamp
    router.put('/:stampUuid', async (req, res) => {
      try {
        const updateData = req.body;
        delete updateData.stamp_uuid; // Prevent UUID modification
        delete updateData._id; // Prevent ID modification

        const updated = await this.dbManager.updateStamp(req.params.stampUuid, updateData);
        
        if (!updated) {
          return res.status(404).json({ error: 'Stamp not found' });
        }

        this.logger.info('Stamp updated', { stampUuid: req.params.stampUuid });
        res.json({ message: 'Stamp updated successfully' });
      } catch (error) {
        this.logger.error('Failed to update stamp', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Delete stamp
    router.delete('/:stampUuid', async (req, res) => {
      try {
        const stamp = await this.dbManager.getStampByUuid(req.params.stampUuid);
        if (!stamp) {
          return res.status(404).json({ error: 'Stamp not found' });
        }

        // Delete associated files
        if (stamp.user_input?.photos) {
          stamp.user_input.photos.forEach(photo => {
            if (photo.file_path && fs.existsSync(photo.file_path)) {
              fs.unlinkSync(photo.file_path);
            }
          });
        }

        await this.dbManager.deleteStamp(req.params.stampUuid);
        this.logger.info('Stamp deleted', { stampUuid: req.params.stampUuid });
        
        res.json({ message: 'Stamp deleted successfully' });
      } catch (error) {
        this.logger.error('Failed to delete stamp', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  createUploadRoutes() {
    const router = express.Router();

    router.post('/images', this.upload.array('images', 10), async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadedFiles = req.files.map((file, index) => ({
          file_name: file.filename,
          file_path: file.path,
          file_size: file.size,
          original_name: file.originalname,
          mime_type: file.mimetype,
          is_primary: index === 0 // First image is primary by default
        }));

        this.logger.info('Files uploaded', { 
          count: uploadedFiles.length,
          user: req.body.user_uuid 
        });

        res.json({
          message: 'Files uploaded successfully',
          files: uploadedFiles
        });
      } catch (error) {
        this.logger.error('File upload failed', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  createSettingsRoutes() {
    const router = express.Router();

    router.get('/', async (req, res) => {
      try {
        const settings = await this.dbManager.getSettings();
        res.json(settings);
      } catch (error) {
        this.logger.error('Failed to get settings', error);
        res.status(500).json({ error: error.message });
      }
    });

    router.post('/', async (req, res) => {
      try {
        await this.dbManager.saveSettings(req.body);
        this.logger.info('Settings updated');
        res.json({ message: 'Settings saved successfully' });
      } catch (error) {
        this.logger.error('Failed to save settings', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  createScottRoutes() {
    const router = express.Router();

    // Search Scott catalog
    router.get('/search', async (req, res) => {
      try {
        const { country, number, description } = req.query;
        
        // Implement Scott catalog search logic here
        // This would integrate with the Scott catalog database
        
        res.json({
          message: 'Scott catalog search - placeholder',
          query: { country, number, description },
          results: []
        });
      } catch (error) {
        this.logger.error('Scott catalog search failed', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  createMarketRoutes() {
    const router = express.Router();

    // Get market research for a stamp
    router.get('/research/:stampUuid', async (req, res) => {
      try {
        // Implement market research logic here
        // This would integrate with eBay API and other market data sources
        
        res.json({
          message: 'Market research - placeholder',
          stampUuid: req.params.stampUuid,
          data: {}
        });
      } catch (error) {
        this.logger.error('Market research failed', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  createSearchRoutes() {
    const router = express.Router();

    // Search all collections, categories, and stamps
    router.get('/', async (req, res) => {
      try {
        const query = req.query.query || '';
        const results = await this.dbManager.search(query);
        res.json(results);
      } catch (error) {
        this.logger.error('Search failed', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      this.logger.error('Unhandled error', error);
      
      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  async start() {
    try {
      // Connect to database
      await this.dbManager.connect();
      this.logger.info('Database connected successfully');

      // Start server
      this.server = this.app.listen(this.port, () => {
        this.logger.info(`Server running on port ${this.port}`);
        console.log(`🚀 Stamp Collection Server running on http://localhost:${this.port}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      this.logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  async shutdown() {
    this.logger.info('Shutting down server...');
    
    if (this.server) {
      this.server.close();
    }
    
    if (this.dbManager) {
      await this.dbManager.disconnect();
    }
    
    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new StampCollectionServer();
  server.start().catch(console.error);
}

module.exports = StampCollectionServer;
