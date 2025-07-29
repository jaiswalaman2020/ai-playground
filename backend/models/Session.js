const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    hasImage: {
      type: Boolean,
      default: false,
    },
    imageUrl: String,
    generatedCode: {
      jsx: String,
      css: String,
      typescript: Boolean,
    },
  },
});

const componentStateSchema = new mongoose.Schema({
  jsx: {
    type: String,
    default: "",
  },
  css: {
    type: String,
    default: "",
  },
  typescript: {
    type: Boolean,
    default: false,
  },
  preview: {
    type: String, // Base64 encoded screenshot or preview data
    default: null,
  },
});

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
      default: "New Component Session",
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    chatHistory: [chatMessageSchema],
    currentComponent: componentStateSchema,
    componentVersions: [componentStateSchema], // For version history
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    settings: {
      autoSave: {
        type: Boolean,
        default: true,
      },
      framework: {
        type: String,
        enum: ["react", "vue", "angular"],
        default: "react",
      },
      styleFramework: {
        type: String,
        enum: ["css", "tailwind", "styled-components", "emotion"],
        default: "css",
      },
    },
    stats: {
      messagesCount: {
        type: Number,
        default: 0,
      },
      generationsCount: {
        type: Number,
        default: 0,
      },
      exportsCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Update lastAccessed on every find
sessionSchema.pre(/^find/, function (next) {
  this.set({ lastAccessed: Date.now() });
  next();
});

// Update stats when chat messages are added
sessionSchema.methods.updateStats = function () {
  this.stats.messagesCount = this.chatHistory.length;
  this.stats.generationsCount = this.chatHistory.filter(
    (msg) => msg.role === "assistant" && msg.metadata.generatedCode
  ).length;
};

// Auto-update stats before saving
sessionSchema.pre("save", function (next) {
  this.updateStats();
  next();
});

module.exports = mongoose.model("Session", sessionSchema);
