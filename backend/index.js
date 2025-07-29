const redisClient = require("./utils/redis");

async function initializeRedis() {
  try {
    console.log("Connecting to Redis...");
    await redisClient.connect();
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
    console.log("⚠️ Continuing without Redis cache...");
  }
}

// Initialize Redis connection
initializeRedis();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await redisClient.disconnect();
    console.log("✅ Redis disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting Redis:", error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  try {
    await redisClient.disconnect();
    console.log("✅ Redis disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting Redis:", error);
  }
  process.exit(0);
});

module.exports = require("./server");
