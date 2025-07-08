const DatabaseManager = require('../../src/database/mongodb');

describe('DatabaseManager', () => {
  let dbManager;

  beforeAll(async () => {
    dbManager = new DatabaseManager();
    await dbManager.connect();
  });

  afterAll(async () => {
    if (dbManager) {
      await dbManager.disconnect();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    const collections = ['users', 'user_stamps', 'scott_stamps', 'countries', 'sets', 'settings'];
    for (const collection of collections) {
      try {
        await dbManager.db.collection(collection).deleteMany({});
      } catch (error) {
        // Collection might not exist, continue
      }
    }
  });

  describe('Connection and Initialization', () => {
    test('should connect to MongoDB successfully', () => {
      expect(dbManager.isConnected).toBe(true);
      expect(dbManager.db).toBeDefined();
    });

    test('should have correct database name', () => {
      expect(dbManager.databaseName).toBe('stamp_collection_test');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Insert test data for search
      await dbManager.db.collection('countries').insertMany([
        { country_code: 'US', name: 'United States', description: 'United States of America' },
        { country_code: 'UK', name: 'United Kingdom', description: 'United Kingdom of Great Britain' },
        { country_code: 'CA', name: 'Canada', description: 'Canada' }
      ]);

      await dbManager.db.collection('user_stamps').insertMany([
        { 
          stamp_uuid: 'test-stamp-1',
          user_uuid: 'test-user-1',
          name: 'Liberty Bell Stamp',
          description: 'Beautiful vintage American stamp'
        },
        {
          stamp_uuid: 'test-stamp-2',
          user_uuid: 'test-user-1',
          name: 'Royal Crown Stamp',
          description: 'British royal commemorative stamp'
        }
      ]);
    });

    test('should search across multiple collections', async () => {
      const results = await dbManager.search('United');
      
      expect(results).toHaveLength(2);
      expect(results.some(r => r.type === 'countries')).toBe(true);
      expect(results.some(r => r.name === 'United States')).toBe(true);
      expect(results.some(r => r.name === 'United Kingdom')).toBe(true);
    });

    test('should return empty array for no matches', async () => {
      const results = await dbManager.search('nonexistent');
      expect(results).toHaveLength(0);
    });

    test('should perform case-insensitive search', async () => {
      const results = await dbManager.search('UNITED');
      expect(results.length).toBeGreaterThan(0);
    });

    test('should include type field in search results', async () => {
      const results = await dbManager.search('United');
      results.forEach(result => {
        expect(result.type).toBeDefined();
        expect(['countries', 'user_stamps', 'scott_stamps', 'sets']).toContain(result.type);
      });
    });
  });

  describe('Stamp Management', () => {
    test('should save a new stamp', async () => {
      const stampData = {
        user_uuid: 'test-user-1',
        user_input: {
          name: 'Test Stamp',
          price: 10.50,
          auction_enabled: true,
          photos: []
        }
      };

      const savedStamp = await dbManager.saveStamp(stampData);
      
      expect(savedStamp).toBeDefined();
      expect(savedStamp.stamp_uuid).toBeDefined();
      expect(savedStamp.user_input.name).toBe('Test Stamp');
      expect(savedStamp.user_input.price).toBe(10.50);
      expect(savedStamp.processing_status).toBe('pending');
      expect(savedStamp.created_at).toBeDefined();
    });

    test('should retrieve stamp by UUID', async () => {
      const stampData = {
        user_uuid: 'test-user-1',
        user_input: {
          name: 'Test Retrieval Stamp',
          price: 15.00,
          auction_enabled: false,
          photos: []
        }
      };

      const savedStamp = await dbManager.saveStamp(stampData);
      const retrievedStamp = await dbManager.getStampByUuid(savedStamp.stamp_uuid);
      
      expect(retrievedStamp).toBeDefined();
      expect(retrievedStamp.stamp_uuid).toBe(savedStamp.stamp_uuid);
      expect(retrievedStamp.user_input.name).toBe('Test Retrieval Stamp');
    });

    test('should return null for non-existent stamp UUID', async () => {
      const result = await dbManager.getStampByUuid('non-existent-uuid');
      expect(result).toBeNull();
    });

    test('should get stamps with filters', async () => {
      // Insert test stamps
      const stamps = [
        {
          user_uuid: 'user-1',
          user_input: { name: 'Stamp 1', price: 10, auction_enabled: true, photos: [] },
          processing_status: 'completed'
        },
        {
          user_uuid: 'user-1',
          user_input: { name: 'Stamp 2', price: 20, auction_enabled: false, photos: [] },
          processing_status: 'pending'
        },
        {
          user_uuid: 'user-2',
          user_input: { name: 'Stamp 3', price: 30, auction_enabled: true, photos: [] },
          processing_status: 'completed'
        }
      ];

      for (const stamp of stamps) {
        await dbManager.saveStamp(stamp);
      }

      // Test filtering by user
      const userStamps = await dbManager.getStamps({ user_uuid: 'user-1' });
      expect(userStamps).toHaveLength(2);

      // Test filtering by status
      const completedStamps = await dbManager.getStamps({ processing_status: 'completed' });
      expect(completedStamps).toHaveLength(2);

      // Test limit
      const limitedStamps = await dbManager.getStamps({ limit: 1 });
      expect(limitedStamps).toHaveLength(1);
    });

    test('should update stamp data', async () => {
      const stampData = {
        user_uuid: 'test-user-1',
        user_input: {
          name: 'Original Name',
          price: 10.00,
          auction_enabled: true,
          photos: []
        }
      };

      const savedStamp = await dbManager.saveStamp(stampData);
      
      const updateData = {
        user_input: {
          name: 'Updated Name',
          price: 15.00,
          auction_enabled: false,
          photos: []
        },
        processing_status: 'completed'
      };

      const updated = await dbManager.updateStamp(savedStamp.stamp_uuid, updateData);
      expect(updated).toBe(true);

      const retrievedStamp = await dbManager.getStampByUuid(savedStamp.stamp_uuid);
      expect(retrievedStamp.user_input.name).toBe('Updated Name');
      expect(retrievedStamp.user_input.price).toBe(15.00);
      expect(retrievedStamp.processing_status).toBe('completed');
      expect(retrievedStamp.updated_at).toBeDefined();
    });

    test('should delete stamp', async () => {
      const stampData = {
        user_uuid: 'test-user-1',
        user_input: {
          name: 'To Be Deleted',
          price: 5.00,
          auction_enabled: false,
          photos: []
        }
      };

      const savedStamp = await dbManager.saveStamp(stampData);
      
      const deleted = await dbManager.deleteStamp(savedStamp.stamp_uuid);
      expect(deleted).toBe(true);

      const retrievedStamp = await dbManager.getStampByUuid(savedStamp.stamp_uuid);
      expect(retrievedStamp).toBeNull();
    });
  });

  describe('Settings Management', () => {
    test('should save and retrieve settings', async () => {
      const settings = {
        default_confidence_threshold: 0.8,
        auto_publish_enabled: true,
        max_upload_size: 5242880
      };

      await dbManager.saveSettings(settings);
      const retrievedSettings = await dbManager.getSettings();
      
      expect(retrievedSettings.default_confidence_threshold).toBe(0.8);
      expect(retrievedSettings.auto_publish_enabled).toBe(true);
      expect(retrievedSettings.max_upload_size).toBe(5242880);
      expect(retrievedSettings.updated_at).toBeDefined();
    });

    test('should update existing settings', async () => {
      const initialSettings = {
        default_confidence_threshold: 0.7,
        auto_publish_enabled: false
      };

      await dbManager.saveSettings(initialSettings);

      const updatedSettings = {
        default_confidence_threshold: 0.9,
        auto_publish_enabled: true,
        new_setting: 'test'
      };

      await dbManager.saveSettings(updatedSettings);
      const retrievedSettings = await dbManager.getSettings();
      
      expect(retrievedSettings.default_confidence_threshold).toBe(0.9);
      expect(retrievedSettings.auto_publish_enabled).toBe(true);
      expect(retrievedSettings.new_setting).toBe('test');
    });
  });

  describe('Database Status', () => {
    test('should return database status', async () => {
      const status = await dbManager.getStatus();
      
      expect(status).toBeDefined();
      expect(status.connected).toBe(true);
      expect(status.database).toBe('stamp_collection_test');
    });
  });

  describe('Error Handling', () => {
    test('should handle search with invalid input gracefully', async () => {
      const results = await dbManager.search('');
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle database disconnection', async () => {
      const tempDbManager = new DatabaseManager();
      await tempDbManager.connect();
      await tempDbManager.disconnect();
      
      expect(tempDbManager.isConnected).toBe(false);
    });
  });
});
