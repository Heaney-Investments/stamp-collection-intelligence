// MongoDB Initialization Script for Stamp Collection Application
// This script creates the database, users, and initial collections with proper authentication

// Switch to admin database for user creation
db = db.getSiblingDB('admin');

// Create application user with read/write permissions
db.createUser({
  user: process.env.MONGODB_APP_USERNAME,
  pwd: process.env.MONGODB_APP_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_INITDB_DATABASE
    },
    {
      role: 'dbAdmin',
      db: process.env.MONGO_INITDB_DATABASE
    }
  ]
});

// Switch to the application database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);

// Create application-specific user for the stamp_collection database
db.createUser({
  user: process.env.MONGODB_USER_USERNAME,
  pwd: process.env.MONGODB_USER_PASSWORD,
  roles: [
    'readWrite'
  ]
});

// Initialize collections with basic structure
print('Creating initial collections...');

// Users collection
db.createCollection('users');
db.users.createIndex({ 'user_uuid': 1 }, { unique: true });
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'username': 1 }, { unique: true });

// User stamps collection
db.createCollection('user_stamps');
db.user_stamps.createIndex({ 'stamp_uuid': 1 }, { unique: true });
db.user_stamps.createIndex({ 'user_uuid': 1 });
db.user_stamps.createIndex({ 'processing_status': 1 });
db.user_stamps.createIndex({ 'created_at': 1 });
db.user_stamps.createIndex({ 'user_input.name': 'text', 'ai_analysis.description': 'text' });

// Scott catalog collection
db.createCollection('scott_stamps');
db.scott_stamps.createIndex({ 'scott_number': 1 }, { unique: true });
db.scott_stamps.createIndex({ 'country': 1 });
db.scott_stamps.createIndex({ 'year_issued': 1 });
db.scott_stamps.createIndex({ 'name': 'text', 'description': 'text' });

// Countries collection for reference data
db.createCollection('countries');
db.countries.createIndex({ 'country_code': 1 }, { unique: true });
db.countries.createIndex({ 'name': 'text' });

// Sets collection for stamp sets/series
db.createCollection('sets');
db.sets.createIndex({ 'set_id': 1 }, { unique: true });
db.sets.createIndex({ 'country': 1 });
db.sets.createIndex({ 'year': 1 });
db.sets.createIndex({ 'name': 'text', 'description': 'text' });

// Market research collection
db.createCollection('market_research');
db.market_research.createIndex({ 'stamp_uuid': 1 });
db.market_research.createIndex({ 'source': 1 });
db.market_research.createIndex({ 'research_date': 1 });

// Sessions collection for user sessions
db.createCollection('sessions');
db.sessions.createIndex({ 'session_id': 1 }, { unique: true });
db.sessions.createIndex({ 'user_uuid': 1 });
db.sessions.createIndex({ 'expires_at': 1 }, { expireAfterSeconds: 0 });

// Settings collection for application settings
db.createCollection('settings');
db.settings.createIndex({ 'type': 1 }, { unique: true });

// Insert some reference data
print('Inserting reference data...');

// Insert default countries
db.countries.insertMany([
  { country_code: 'US', name: 'United States', description: 'United States of America' },
  { country_code: 'UK', name: 'United Kingdom', description: 'United Kingdom of Great Britain and Northern Ireland' },
  { country_code: 'CA', name: 'Canada', description: 'Canada' },
  { country_code: 'AU', name: 'Australia', description: 'Australia' },
  { country_code: 'DE', name: 'Germany', description: 'Germany' },
  { country_code: 'FR', name: 'France', description: 'France' },
  { country_code: 'IT', name: 'Italy', description: 'Italy' },
  { country_code: 'JP', name: 'Japan', description: 'Japan' }
]);

// Insert default application settings
db.settings.insertOne({
  type: 'user_settings',
  default_confidence_threshold: 0.7,
  auto_publish_enabled: false,
  max_upload_size: 10485760,
  supported_image_types: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
  created_at: new Date(),
  updated_at: new Date()
});

print('MongoDB initialization completed successfully!');
print('Database: ' + process.env.MONGO_INITDB_DATABASE);
print('Application user: ' + process.env.MONGODB_APP_USERNAME);
print('Database user: ' + process.env.MONGODB_USER_USERNAME);
print('Collections created with indexes');
print('Reference data inserted');
