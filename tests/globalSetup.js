const { MongoMemoryServer } = require('mongodb-memory-server');
const { GenericContainer } = require('testcontainers');

let mongoServer;
let redisContainer;

module.exports = async () => {
  console.log('🔧 Setting up test environment...');

  try {
    // Start MongoDB Memory Server
    console.log('📦 Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'stamp_collection_test',
      },
    });

    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URL = mongoUri;
    global.__MONGO_URI__ = mongoUri;
    global.__MONGO_DB_NAME__ = 'stamp_collection_test';

    console.log('✅ MongoDB Memory Server started');

    // Start Redis container for integration tests
    console.log('📦 Starting Redis container...');
    redisContainer = await new GenericContainer('redis:7.2-alpine')
      .withExposedPorts(6379)
      .withCmd(['redis-server', '--requirepass', 'test123'])
      .start();

    const redisPort = redisContainer.getMappedPort(6379);
    const redisHost = redisContainer.getHost();
    process.env.REDIS_URL = `redis://:test123@${redisHost}:${redisPort}`;

    console.log('✅ Redis container started');

    // Store references for cleanup
    global.__MONGO_SERVER__ = mongoServer;
    global.__REDIS_CONTAINER__ = redisContainer;

    console.log('🎉 Test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
};
