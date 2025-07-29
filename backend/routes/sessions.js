const express = require("express");
const Joi = require("joi");
const Session = require("../models/Session");
const auth = require("../middleware/auth");
const redisClient = require("../utils/redis");

const router = express.Router();

// Validation schemas
const createSessionSchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(500),
  tags: Joi.array().items(Joi.string().max(30)),
  settings: Joi.object({
    framework: Joi.string().valid("react", "vue", "angular"),
    styleFramework: Joi.string().valid(
      "css",
      "tailwind",
      "styled-components",
      "emotion"
    ),
    autoSave: Joi.boolean(),
  }),
});

const updateSessionSchema = Joi.object({
  title: Joi.string().max(100),
  description: Joi.string().max(500),
  tags: Joi.array().items(Joi.string().max(30)),
  currentComponent: Joi.object({
    jsx: Joi.string(),
    css: Joi.string(),
    typescript: Joi.boolean(),
  }),
  settings: Joi.object({
    framework: Joi.string().valid("react", "vue", "angular"),
    styleFramework: Joi.string().valid(
      "css",
      "tailwind",
      "styled-components",
      "emotion"
    ),
    autoSave: Joi.boolean(),
  }),
});

// @route   GET /api/sessions
// @desc    Get all user sessions
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = "lastAccessed" } = req.query;

    const query = {
      userId: req.user._id,
      isActive: true,
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: -1 },
      populate: {
        path: "userId",
        select: "name email",
      },
    };

    const sessions = await Session.find(query)
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-chatHistory.metadata.generatedCode") // Exclude large code data
      .exec();

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Server error getting sessions" });
  }
});

// @route   POST /api/sessions
// @desc    Create new session
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { error } = createSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const sessionData = {
      userId: req.user._id,
      title: req.body.title || "New Component Session",
      description: req.body.description || "",
      tags: req.body.tags || [],
      settings: {
        framework: "react",
        styleFramework: "css",
        autoSave: true,
        ...req.body.settings,
      },
    };

    const session = new Session(sessionData);
    await session.save();

    // Cache session in Redis
    try {
      await redisClient.setSession(session._id.toString(), {
        id: session._id,
        title: session.title,
        userId: session.userId,
        lastAccessed: session.lastAccessed,
      });
    } catch (redisError) {
      console.warn("Redis caching failed:", redisError);
    }

    res.status(201).json({
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ error: "Server error creating session" });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    // Check Redis cache first
    let session;
    try {
      const cachedSession = await redisClient.getSession(req.params.id);
      if (
        cachedSession &&
        cachedSession.userId.toString() === req.user._id.toString()
      ) {
        // Get full session from DB if cache hit
        session = await Session.findById(req.params.id);
      }
    } catch (redisError) {
      console.warn("Redis get failed:", redisError);
    }

    if (!session) {
      session = await Session.findOne({
        _id: req.params.id,
        userId: req.user._id,
        isActive: true,
      });
    }

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Update last accessed
    session.lastAccessed = new Date();
    await session.save();

    res.json({ session });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ error: "Server error getting session" });
  }
});

// @route   PUT /api/sessions/:id
// @desc    Update session
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { error } = updateSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Update fields
    if (req.body.title) session.title = req.body.title;
    if (req.body.description !== undefined)
      session.description = req.body.description;
    if (req.body.tags) session.tags = req.body.tags;
    if (req.body.settings) {
      session.settings = { ...session.settings, ...req.body.settings };
    }
    if (req.body.currentComponent) {
      // Save previous version
      if (session.currentComponent.jsx || session.currentComponent.css) {
        session.componentVersions.push({
          jsx: session.currentComponent.jsx,
          css: session.currentComponent.css,
          typescript: session.currentComponent.typescript,
        });
      }
      session.currentComponent = {
        ...session.currentComponent,
        ...req.body.currentComponent,
      };
    }

    session.lastAccessed = new Date();
    await session.save();

    // Update Redis cache
    try {
      await redisClient.setSession(session._id.toString(), {
        id: session._id,
        title: session.title,
        userId: session.userId,
        lastAccessed: session.lastAccessed,
      });
    } catch (redisError) {
      console.warn("Redis update failed:", redisError);
    }

    res.json({
      message: "Session updated successfully",
      session,
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ error: "Server error updating session" });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete session (soft delete)
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.isActive = false;
    await session.save();

    // Remove from Redis cache
    try {
      await redisClient.deleteSession(req.params.id);
    } catch (redisError) {
      console.warn("Redis delete failed:", redisError);
    }

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ error: "Server error deleting session" });
  }
});

// @route   POST /api/sessions/:id/chat
// @desc    Add message to session chat
// @access  Private
router.post("/:id/chat", auth, async (req, res) => {
  try {
    const messageSchema = Joi.object({
      role: Joi.string().valid("user", "assistant").required(),
      content: Joi.string().required(),
      metadata: Joi.object({
        hasImage: Joi.boolean(),
        imageUrl: Joi.string().uri(),
        generatedCode: Joi.object({
          jsx: Joi.string(),
          css: Joi.string(),
          typescript: Joi.boolean(),
        }),
      }),
    });

    const { error } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const message = {
      role: req.body.role,
      content: req.body.content,
      timestamp: new Date(),
      metadata: req.body.metadata || {},
    };

    session.chatHistory.push(message);
    session.lastAccessed = new Date();
    await session.save();

    res.json({
      message: "Message added successfully",
      chatMessage: message,
    });
  } catch (error) {
    console.error("Add chat message error:", error);
    res.status(500).json({ error: "Server error adding message" });
  }
});

// @route   GET /api/sessions/:id/export
// @desc    Export session data
// @access  Private
router.get("/:id/export", auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Update export stats
    session.stats.exportsCount += 1;
    await session.save();

    const exportData = {
      session: {
        title: session.title,
        description: session.description,
        tags: session.tags,
        createdAt: session.createdAt,
        stats: session.stats,
      },
      component: session.currentComponent,
      chatHistory: session.chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      componentVersions: session.componentVersions,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${session.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_export.json"`
    );
    res.json(exportData);
  } catch (error) {
    console.error("Export session error:", error);
    res.status(500).json({ error: "Server error exporting session" });
  }
});

module.exports = router;
