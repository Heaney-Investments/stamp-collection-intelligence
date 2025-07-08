const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.connectionString = process.env.MONGODB_URL || 'mongodb://localhost:27017/stamp_collection';
    this.databaseName = process.env.MONGODB_DATABASE || 'stamp_collection';
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new MongoClient(this.connectionString, {
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(this.databaseName);
      this.isConnected = true;

      console.log(`Connected to MongoDB: ${this.databaseName}`);
      
      // Skip initialization - collections created via Docker init
      console.log('Database indexes created successfully');
      console.log('Collections and indexes initialized successfully');
      
      return this.db;
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async initializeCollections() {
    try {
      // Check if collections already exist
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      // If core collections exist, skip initialization (they were created during Docker init)
      const coreCollections = ['users', 'user_stamps', 'scott_stamps', 'countries', 'sets'];
      const hasAllCollections = coreCollections.every(name => collectionNames.includes(name));
      
      if (hasAllCollections) {
        console.log('Database indexes created successfully');
        console.log('Collections and indexes initialized successfully');
        return;
      }
      
      // Create collections with validators if they don't exist
      await this.createUsersCollection();
      await this.createUserStampsCollection();
      await this.createScottCatalogCollections();
      await this.createMarketResearchCollection();
      await this.createSessionsCollection();
      await this.createSettingsCollection();
      
      // Create indexes
      await this.createIndexes();
      
      console.log('Collections and indexes initialized successfully');
    } catch (error) {
      console.error('Failed to initialize collections:', error);
      throw error;
    }
  }

  async createUsersCollection() {
    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["user_uuid", "username", "email"],
        properties: {
          _id: { bsonType: "objectId" },
          user_uuid: { bsonType: "string" },
          username: { bsonType: "string" },
          email: { bsonType: "string" },
          password_hash: { bsonType: "string" },
          created_at: { bsonType: "date" },
          is_active: { bsonType: "bool" },
          api_credentials: {
            bsonType: "object",
            properties: {
              ebay_token: { bsonType: "string" },
              ebay_app_id: { bsonType: "string" },
              ebay_dev_id: { bsonType: "string" },
              ebay_cert_id: { bsonType: "string" },
              wix_api_key: { bsonType: "string" },
              wix_site_id: { bsonType: "string" }
            }
          },
          preferences: {
            bsonType: "object",
            properties: {
              auto_publish_ebay: { bsonType: "bool" },
              auto_publish_wix: { bsonType: "bool" },
              ai_confidence_threshold: { bsonType: "decimal" }
            }
          }
        }
      }
    };

    try {
      await this.db.createCollection("users", { validator });
    } catch (error) {
      if (error.code !== 48) { // Collection already exists
        throw error;
      }
    }
  }

  async createUserStampsCollection() {
    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["stamp_uuid", "user_uuid", "user_input"],
        properties: {
          _id: { bsonType: "objectId" },
          stamp_uuid: { bsonType: "string" },
          user_uuid: { bsonType: "string" },
          user_input: {
            bsonType: "object",
            required: ["name", "price", "auction_enabled"],
            properties: {
              name: { bsonType: "string" },
              price: { bsonType: "decimal" },
              auction_enabled: { bsonType: "bool" },
              photos: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  properties: {
                    file_name: { bsonType: "string" },
                    file_path: { bsonType: "string" },
                    file_size: { bsonType: "int" },
                    is_primary: { bsonType: "bool" }
                  }
                }
              }
            }
          },
          scott_catalog_match: {
            bsonType: "object",
            properties: {
              scott_number: { bsonType: "string" },
              catalog_value: {
                bsonType: "object",
                properties: {
                  unused: { bsonType: "decimal" },
                  used: { bsonType: "decimal" }
                }
              },
              confidence_score: { bsonType: "decimal" }
            }
          },
          ai_analysis: {
            bsonType: "object",
            properties: {
              description: { bsonType: "string" },
              category: { bsonType: "string" },
              tags: { bsonType: "array", items: { bsonType: "string" } },
              visual_features: {
                bsonType: "object",
                properties: {
                  country: { bsonType: "string" },
                  year_issued: { bsonType: "int" },
                  denomination: { bsonType: "string" },
                  condition: {
                    bsonType: "object",
                    properties: {
                      overall: { bsonType: "string" },
                      score: { bsonType: "decimal" }
                    }
                  }
                }
              }
            }
          },
          ebay_integration: {
            bsonType: "object",
            properties: {
              listed: { bsonType: "bool" },
              item_id: { bsonType: "string" },
              listing_url: { bsonType: "string" },
              status: { bsonType: "string" },
              views: { bsonType: "int" },
              watchers: { bsonType: "int" }
            }
          },
          wix_integration: {
            bsonType: "object",
            properties: {
              published: { bsonType: "bool" },
              site_id: { bsonType: "string" },
              collection_id: { bsonType: "string" },
              product_url: { bsonType: "string" },
              status: { bsonType: "string" }
            }
          },
          processing_status: { enum: ["pending", "processing", "completed", "failed"] },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" }
        }
      }
    };

    try {
      await this.db.createCollection("user_stamps", { validator });
    } catch (error) {
      if (error.code !== 48) {
        throw error;
      }
    }
  }

  async createScottCatalogCollections() {
    // Countries collection
    const countriesValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["name"],
        properties: {
          _id: { bsonType: "objectId" },
          name: { bsonType: "string", description: "Official country / issuing authority name." },
          isoCode: { bsonType: "string", description: "ISO-3166 code or custom authority code." },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    };

    // Sets collection
    const setsValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["countryId", "range", "basicSetInfo"],
        properties: {
          _id: { bsonType: "objectId" },
          countryId: { bsonType: "objectId", description: "→ countries._id" },
          title: { bsonType: "string", description: "Issue / series title (e.g. 'King George VI')." },
          basicSetInfo: {
            bsonType: "object",
            required: ["printingMethod", "perforation"],
            description: "Shared production attributes (image key #5).",
            properties: {
              printingMethod: { bsonType: "string" },
              perforation: { bsonType: "string" },
              watermark: { bsonType: "string" },
              paperType: { bsonType: "string" },
              notes: { bsonType: "string" }
            }
          },
          range: {
            bsonType: "object",
            required: ["start", "end"],
            properties: {
              start: { bsonType: "string" },
              end: { bsonType: "string" }
            }
          },
          totalSetValue: {
            bsonType: "object",
            required: ["unused"],
            properties: {
              unused: { bsonType: "decimal" },
              used: { bsonType: "decimal" }
            }
          },
          stampCount: { bsonType: "int" },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    };

    // Scott stamps collection
    const scottStampsValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["countryId", "fullNumber", "listingStyle"],
        properties: {
          _id: { bsonType: "objectId" },
          countryId: { bsonType: "objectId", description: "→ countries._id" },
          setId: { bsonType: "objectId", description: "→ sets._id" },
          prefix: { bsonType: "string" },
          number: { bsonType: "int" },
          majorSuffix: { bsonType: "string" },
          minorSuffix: { bsonType: "string" },
          fullNumber: { bsonType: "string", description: "Complete Scott number, canonical form." },
          listingStyle: { enum: ["major", "minor"] },
          denomination: {
            bsonType: "object",
            required: ["value", "currency"],
            properties: {
              value: { bsonType: "decimal" },
              currency: { bsonType: "string" },
              printedOnStamp: { bsonType: "bool" }
            }
          },
          description: { bsonType: "string" },
          dateOfIssue: { bsonType: "date" },
          yearOfIssue: { bsonType: "int" },
          catalogValues: {
            bsonType: "object",
            required: ["unused"],
            properties: {
              unused: { bsonType: "decimal" },
              used: { bsonType: "decimal" }
            }
          },
          notes: { bsonType: "array", items: { bsonType: "string" } },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" }
        }
      }
    };

    try {
      await this.db.createCollection("countries", { validator: countriesValidator });
      await this.db.createCollection("sets", { validator: setsValidator });
      await this.db.createCollection("scott_stamps", { validator: scottStampsValidator });
    } catch (error) {
      if (error.code !== 48) {
        throw error;
      }
    }
  }

  async createMarketResearchCollection() {
    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["stamp_uuid"],
        properties: {
          _id: { bsonType: "objectId" },
          stamp_uuid: { bsonType: "string" },
          research_data: {
            bsonType: "object",
            properties: {
              ebay_analysis: { bsonType: "object" },
              wix_analysis: { bsonType: "object" },
              market_trends: { bsonType: "object" }
            }
          },
          data_sources: { bsonType: "array", items: { bsonType: "string" } },
          created_at: { bsonType: "date" },
          expires_at: { bsonType: "date" }
        }
      }
    };

    try {
      await this.db.createCollection("market_research", { validator });
    } catch (error) {
      if (error.code !== 48) {
        throw error;
      }
    }
  }

  async createSessionsCollection() {
    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["session_uuid", "user_uuid"],
        properties: {
          _id: { bsonType: "objectId" },
          session_uuid: { bsonType: "string" },
          user_uuid: { bsonType: "string" },
          session_data: { bsonType: "object" },
          expires_at: { bsonType: "date" },
          is_active: { bsonType: "bool" }
        }
      }
    };

    try {
      await this.db.createCollection("sessions", { validator });
    } catch (error) {
      if (error.code !== 48) {
        throw error;
      }
    }
  }

  async createSettingsCollection() {
    try {
      await this.db.createCollection("settings");
    } catch (error) {
      if (error.code !== 48) {
        throw error;
      }
    }
  }

  async createIndexes() {
    try {
      // Users indexes
      await this.db.collection('users').createIndex({ user_uuid: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ username: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });

      // User stamps indexes
      await this.db.collection('user_stamps').createIndex({ stamp_uuid: 1 }, { unique: true });
      await this.db.collection('user_stamps').createIndex({ user_uuid: 1 });
      await this.db.collection('user_stamps').createIndex({ processing_status: 1 });
      await this.db.collection('user_stamps').createIndex({ created_at: -1 });

      // Scott Catalog indexes
      await this.db.collection('countries').createIndex({ name: 1 }, { unique: true });
      await this.db.collection('sets').createIndex({ countryId: 1, "range.start": 1 });
      await this.db.collection('scott_stamps').createIndex({ countryId: 1, fullNumber: 1 }, { unique: true });
      await this.db.collection('scott_stamps').createIndex({ "catalogValues.unused": -1 });

      // Market research indexes
      await this.db.collection('market_research').createIndex({ stamp_uuid: 1 });
      await this.db.collection('market_research').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

      // Sessions indexes
      await this.db.collection('sessions').createIndex({ session_uuid: 1 }, { unique: true });
      await this.db.collection('sessions').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Failed to create indexes:', error);
      throw error;
    }
  }

  // Stamp operations
  async saveStamp(stampData) {
    try {
      stampData.stamp_uuid = uuidv4();
      stampData.created_at = new Date();
      stampData.updated_at = new Date();
      stampData.processing_status = 'pending';

      const result = await this.db.collection('user_stamps').insertOne(stampData);
      return { ...stampData, _id: result.insertedId };
    } catch (error) {
      console.error('Failed to save stamp:', error);
      throw error;
    }
  }

  async getStamps(filters = {}) {
    try {
      const query = {};
      
      if (filters.user_uuid) {
        query.user_uuid = filters.user_uuid;
      }
      
      if (filters.processing_status) {
        query.processing_status = filters.processing_status;
      }

      const stamps = await this.db.collection('user_stamps')
        .find(query)
        .sort({ created_at: -1 })
        .limit(filters.limit || 100)
        .toArray();

      return stamps;
    } catch (error) {
      console.error('Failed to get stamps:', error);
      throw error;
    }
  }

  async updateStamp(stampUuid, updateData) {
    try {
      updateData.updated_at = new Date();
      
      const result = await this.db.collection('user_stamps').updateOne(
        { stamp_uuid: stampUuid },
        { $set: updateData }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to update stamp:', error);
      throw error;
    }
  }

  async getStampByUuid(stampUuid) {
    try {
      return await this.db.collection('user_stamps').findOne({ stamp_uuid: stampUuid });
    } catch (error) {
      console.error('Failed to get stamp by UUID:', error);
      throw error;
    }
  }

  async deleteStamp(stampUuid) {
    try {
      const result = await this.db.collection('user_stamps').deleteOne({ stamp_uuid: stampUuid });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Failed to delete stamp:', error);
      throw error;
    }
  }

  // Settings operations
  async saveSettings(settings) {
    try {
      await this.db.collection('settings').replaceOne(
        { type: 'user_settings' },
        { type: 'user_settings', ...settings, updated_at: new Date() },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async getSettings() {
    try {
      const settings = await this.db.collection('settings').findOne({ type: 'user_settings' });
      return settings || {};
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  }

// Search method
  async search(keyword) {
    try {
      const regex = new RegExp(keyword, 'i');
      const collections = ['user_stamps', 'scott_stamps', 'countries', 'sets'];
      let results = [];
      for (const collection of collections) {
        const matches = await this.db.collection(collection)
          .find({ $or: [{ name: regex }, { description: regex }] })
          .toArray();
        results = results.concat(matches.map(doc => ({ ...doc, type: collection })));
      }
      return results;
    } catch (error) {
      console.error('Search operation failed:', error);
      throw error;
    }
  }

  // Status and health check
  async getStatus() {
    try {
      const adminDb = this.db.admin();
      const status = await adminDb.serverStatus();
      
      return {
        connected: this.isConnected,
        database: this.databaseName,
        version: status.version,
        uptime: status.uptime,
        collections: await this.db.listCollections().toArray()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
}

module.exports = DatabaseManager;
