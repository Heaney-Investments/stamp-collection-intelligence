module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Stop MongoDB Memory Server
    if (global.__MONGO_SERVER__) {
      console.log('🛑 Stopping MongoDB Memory Server...');
      await global.__MONGO_SERVER__.stop();
      console.log('✅ MongoDB Memory Server stopped');
    }

    // Stop Redis container
    if (global.__REDIS_CONTAINER__) {
      console.log('🛑 Stopping Redis container...');
      await global.__REDIS_CONTAINER__.stop();
      console.log('✅ Redis container stopped');
    }

    console.log('🎉 Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error to avoid breaking test suite
  }
};
