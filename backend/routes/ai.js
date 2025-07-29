const express = require("express");
const Joi = require("joi");
const multer = require("multer");
const Session = require("../models/Session");
const auth = require("../middleware/auth");
const aiService = require("../utils/aiService");
const redisClient = require("../utils/redis");

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Validation schemas
const generateSchema = Joi.object({
  prompt: Joi.string().min(3).max(2000).required(),
  sessionId: Joi.string().required(),
  context: Joi.object({
    framework: Joi.string().valid("react", "vue", "angular"),
    styleFramework: Joi.string().valid(
      "css",
      "tailwind",
      "styled-components",
      "emotion"
    ),
    typescript: Joi.boolean(),
    existingCode: Joi.object({
      jsx: Joi.string(),
      css: Joi.string(),
    }),
    isIteration: Joi.boolean(),
  }),
});

const refineSchema = Joi.object({
  sessionId: Joi.string().required(),
  refinementPrompt: Joi.string().min(3).max(1000).required(),
  originalCode: Joi.object({
    jsx: Joi.string().required(),
    css: Joi.string().required(),
  }).required(),
});

// @route   POST /api/ai/generate
// @desc    Generate component from prompt
// @access  Private
router.post("/generate", auth, async (req, res) => {
  try {
    const { error } = generateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { prompt, sessionId, context = {} } = req.body;

    // Verify session ownership
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check Redis cache for similar prompts
    let generatedCode;
    const cacheKey = `${prompt}_${JSON.stringify(context)}`;

    try {
      const cachedResponse = await redisClient.getCachedAIResponse(cacheKey);
      if (cachedResponse) {
        console.log("Found cached AI response:", cachedResponse);

        // Validate cached response structure
        if (
          cachedResponse &&
          typeof cachedResponse === "object" &&
          cachedResponse.jsx
        ) {
          generatedCode = cachedResponse;
          console.log("Using cached AI response");
        } else {
          console.warn("Cached response invalid, ignoring cache");
        }
      }
    } catch (redisError) {
      console.warn("Redis cache check failed:", redisError);
    }

    if (!generatedCode) {
      // Merge session settings with context
      const aiContext = {
        framework: session.settings.framework,
        styleFramework: session.settings.styleFramework,
        typescript: false,
        ...context,
      };

      // Generate component using AI service
      generatedCode = await aiService.generateComponent(prompt, aiContext);

      console.log("AI service returned:", generatedCode);

      // Validate that we have the expected structure
      if (!generatedCode || typeof generatedCode !== "object") {
        throw new Error("AI service returned invalid response");
      }

      if (!generatedCode.jsx) {
        console.error("AI service response missing jsx:", generatedCode);
        throw new Error("AI service response missing jsx property");
      }

      // Validate generated code
      const validation = aiService.validateGeneratedCode(generatedCode);
      if (!validation.isValid) {
        console.warn("Generated code validation failed:", validation.errors);
        // Continue anyway, but log the issues
      }

      // Cache the response
      try {
        await redisClient.cacheAIResponse(cacheKey, generatedCode, 1800); // 30 minutes
      } catch (redisError) {
        console.warn("Redis caching failed:", redisError);
      }
    }

    // Add user message to chat history
    session.chatHistory.push({
      role: "user",
      content: prompt,
      timestamp: new Date(),
      metadata: {
        hasImage: false,
      },
    });

    // Final validation of generatedCode before using it
    if (!generatedCode || !generatedCode.jsx) {
      throw new Error("Failed to generate valid component code");
    }

    // Add AI response to chat history
    session.chatHistory.push({
      role: "assistant",
      content: generatedCode.explanation || "Component generated successfully",
      timestamp: new Date(),
      metadata: {
        generatedCode: {
          jsx: generatedCode.jsx,
          css: generatedCode.css,
          typescript: context.typescript || false,
        },
      },
    });

    // Update current component if this is the latest generation
    // Initialize currentComponent if it doesn't exist
    if (!session.currentComponent) {
      session.currentComponent = {
        jsx: "",
        css: "",
        typescript: false,
      };
    }

    if (
      !context.isIteration ||
      !session.currentComponent ||
      !session.currentComponent.jsx
    ) {
      // Save previous version if it exists
      if (session.currentComponent.jsx || session.currentComponent.css) {
        session.componentVersions.push({
          jsx: session.currentComponent.jsx,
          css: session.currentComponent.css,
          typescript: session.currentComponent.typescript,
        });
      }

      session.currentComponent = {
        jsx: generatedCode.jsx,
        css: generatedCode.css,
        typescript: context.typescript || false,
      };
    }

    session.lastAccessed = new Date();
    await session.save();

    // Update Redis session cache
    try {
      await redisClient.setSession(session._id.toString(), {
        id: session._id,
        title: session.title,
        userId: session.userId,
        lastAccessed: session.lastAccessed,
      });
    } catch (redisError) {
      console.warn("Redis session update failed:", redisError);
    }

    res.json({
      message: "Component generated successfully",
      generatedCode,
      chatMessage: session.chatHistory[session.chatHistory.length - 1],
    });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({
      error: "AI generation failed",
      details: error.message,
    });
  }
});

// @route   POST /api/ai/refine
// @desc    Refine existing component
// @access  Private
router.post("/refine", auth, async (req, res) => {
  try {
    const { error } = refineSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { sessionId, refinementPrompt, originalCode } = req.body;

    // Verify session ownership
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const aiContext = {
      framework: session.settings.framework,
      styleFramework: session.settings.styleFramework,
      typescript: session.currentComponent.typescript || false,
    };

    // Use AI service to refine component
    const refinedCode = await aiService.refineComponent(
      originalCode,
      refinementPrompt,
      aiContext
    );

    // Validate refined code
    const validation = aiService.validateGeneratedCode(refinedCode);
    if (!validation.isValid) {
      console.warn("Refined code validation failed:", validation.errors);
    }

    // Add user message to chat history
    session.chatHistory.push({
      role: "user",
      content: refinementPrompt,
      timestamp: new Date(),
      metadata: {
        hasImage: false,
        isRefinement: true,
      },
    });

    // Add AI response to chat history
    session.chatHistory.push({
      role: "assistant",
      content: refinedCode.explanation || "Component refined successfully",
      timestamp: new Date(),
      metadata: {
        generatedCode: {
          jsx: refinedCode.jsx,
          css: refinedCode.css,
          typescript: session.currentComponent.typescript || false,
        },
        isRefinement: true,
      },
    });

    // Save previous version
    session.componentVersions.push({
      jsx: session.currentComponent.jsx,
      css: session.currentComponent.css,
      typescript: session.currentComponent.typescript,
    });

    // Update current component
    session.currentComponent = {
      jsx: refinedCode.jsx,
      css: refinedCode.css,
      typescript: session.currentComponent.typescript || false,
    };

    session.lastAccessed = new Date();
    await session.save();

    res.json({
      message: "Component refined successfully",
      refinedCode,
      chatMessage: session.chatHistory[session.chatHistory.length - 1],
    });
  } catch (error) {
    console.error("AI refinement error:", error);
    res.status(500).json({
      error: "AI refinement failed",
      details: error.message,
    });
  }
});

// @route   POST /api/ai/generate-variations
// @desc    Generate multiple variations of a component
// @access  Private
router.post("/generate-variations", auth, async (req, res) => {
  try {
    const variationSchema = Joi.object({
      prompt: Joi.string().min(3).max(2000).required(),
      sessionId: Joi.string().required(),
      count: Joi.number().min(1).max(5).default(3),
      context: Joi.object().default({}),
    });

    const { error } = variationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { prompt, sessionId, count = 3, context = {} } = req.body;

    // Verify session ownership
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const aiContext = {
      framework: session.settings.framework,
      styleFramework: session.settings.styleFramework,
      typescript: false,
      ...context,
    };

    // Generate variations
    const variations = await aiService.generateMultipleVariations(
      prompt,
      count,
      aiContext
    );

    res.json({
      message: "Variations generated successfully",
      variations,
      count: variations.length,
    });
  } catch (error) {
    console.error("AI variations error:", error);
    res.status(500).json({
      error: "AI variations generation failed",
      details: error.message,
    });
  }
});

// @route   POST /api/ai/generate-with-image
// @desc    Generate component from prompt with image
// @access  Private
router.post(
  "/generate-with-image",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { prompt, sessionId } = req.body;

      if (!prompt || !sessionId) {
        return res
          .status(400)
          .json({ error: "Prompt and sessionId are required" });
      }

      // Verify session ownership
      const session = await Session.findOne({
        _id: sessionId,
        userId: req.user._id,
        isActive: true,
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Convert image to base64 (for future AI models that support images)
      const imageBase64 = req.file.buffer.toString("base64");
      const imageDataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

      // For now, generate based on text prompt only
      // Future: integrate image-to-code AI models
      const enhancedPrompt = `${prompt}\n\n[Image analysis would go here - describing the uploaded image elements and layout]`;

      const aiContext = {
        framework: session.settings.framework,
        styleFramework: session.settings.styleFramework,
        typescript: false,
      };

      const generatedCode = await aiService.generateComponent(
        enhancedPrompt,
        aiContext
      );

      // Add user message with image to chat history
      session.chatHistory.push({
        role: "user",
        content: prompt,
        timestamp: new Date(),
        metadata: {
          hasImage: true,
          imageUrl: imageDataUrl, // Store base64 for now
        },
      });

      // Add AI response to chat history
      session.chatHistory.push({
        role: "assistant",
        content:
          generatedCode.explanation ||
          "Component generated from image and prompt",
        timestamp: new Date(),
        metadata: {
          generatedCode: {
            jsx: generatedCode.jsx,
            css: generatedCode.css,
            typescript: false,
          },
        },
      });

      // Update current component
      if (session.currentComponent.jsx || session.currentComponent.css) {
        session.componentVersions.push({
          jsx: session.currentComponent.jsx,
          css: session.currentComponent.css,
          typescript: session.currentComponent.typescript,
        });
      }

      session.currentComponent = {
        jsx: generatedCode.jsx,
        css: generatedCode.css,
        typescript: false,
      };

      session.lastAccessed = new Date();
      await session.save();

      res.json({
        message: "Component generated from image successfully",
        generatedCode,
        chatMessage: session.chatHistory[session.chatHistory.length - 1],
      });
    } catch (error) {
      console.error("AI image generation error:", error);
      res.status(500).json({
        error: "AI image generation failed",
        details: error.message,
      });
    }
  }
);

// @route   GET /api/ai/suggestions
// @desc    Get AI suggestions for component improvements
// @access  Private
router.get("/suggestions/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Generate suggestions based on current component and chat history
    const suggestions = [
      "Add responsive design for mobile devices",
      "Implement hover effects and animations",
      "Add accessibility features (ARIA labels, keyboard navigation)",
      "Optimize for performance and loading speed",
      "Add error handling and loading states",
      "Implement dark mode support",
      "Add unit tests for the component",
      "Optimize for SEO and semantic HTML",
    ];

    // TODO: Use AI to generate contextual suggestions based on the current component

    res.json({
      suggestions: suggestions.slice(0, 4), // Return 4 random suggestions
      message: "Suggestions generated successfully",
    });
  } catch (error) {
    console.error("AI suggestions error:", error);
    res.status(500).json({
      error: "Failed to generate suggestions",
      details: error.message,
    });
  }
});

module.exports = router;
