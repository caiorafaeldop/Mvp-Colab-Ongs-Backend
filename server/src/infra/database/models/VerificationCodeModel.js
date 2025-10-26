const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset', 'registration'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar performance
verificationCodeSchema.index({ email: 1, type: 1, used: 1 });
verificationCodeSchema.index({ expiresAt: 1 });

const VerificationCodeModel = mongoose.model('VerificationCode', verificationCodeSchema);

module.exports = VerificationCodeModel;
