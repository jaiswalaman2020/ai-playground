const { createClient } = require("redis");

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
      });

      this.client.on("error", (err) => {
        console.error("Redis error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis connected successfully");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.log("Redis disconnected");
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async set(key, value, expiration = null) {
    if (!this.isConnected) {
      console.warn("Redis client not connected - skipping cache operation");
      return null;
    }

    try {
      if (expiration) {
        return await this.client.setEx(key, expiration, JSON.stringify(value));
      }
      return await this.client.set(key, JSON.stringify(value));
    } catch (error) {
      console.error("Redis set error:", error);
      throw error;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis get error:", error);
      throw error;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }

    try {
      return await this.client.del(key);
    } catch (error) {
      console.error("Redis del error:", error);
      throw error;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }

    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error("Redis exists error:", error);
      throw error;
    }
  }

  async setSession(sessionId, sessionData, expiration = 3600) {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, expiration);
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  async cacheAIResponse(prompt, response, expiration = 1800) {
    const key = `ai_cache:${Buffer.from(prompt).toString("base64")}`;
    return await this.set(key, response, expiration);
  }

  async getCachedAIResponse(prompt) {
    const key = `ai_cache:${Buffer.from(prompt).toString("base64")}`;
    return await this.get(key);
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
