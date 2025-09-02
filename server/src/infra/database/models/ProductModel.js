const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrls: {
      type: [String],
      required: true,
      validate: {
        validator: (v) =>
          Array.isArray(v) &&
          v.length > 0 &&
          v.every((url) => url.trim().length > 0),
        message: "At least one non-empty image URL is required",
      },
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      required: false,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
productSchema.index({ name: "text", description: "text" });
productSchema.index({ organizationId: 1 });
productSchema.index({ isAvailable: 1 });

module.exports = mongoose.model("Product", productSchema);
