/**
 * MongoDB Model para Organization (Composite Pattern)
 */

const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['matrix', 'branch', 'independent'],
    default: 'independent'
  },
  // Composite Pattern - Hierarchy
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  // Metadata
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'organizations'
});

// Indexes para performance
organizationSchema.index({ parentId: 1 });
organizationSchema.index({ type: 1 });
organizationSchema.index({ email: 1 }, { unique: true });

const OrganizationModel = mongoose.model('Organization', organizationSchema);

module.exports = OrganizationModel;
