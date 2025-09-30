const Collaboration = require('../../domain/entities/Collaboration');
const mongoose = require('mongoose');

// Schema do Collaboration
const CollaborationSchema = new mongoose.Schema(
  {
    requesterOrgId: { type: String, required: true },
    requesterOrgName: { type: String, required: true },
    targetOrgId: { type: String, required: true },
    targetOrgName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    resources: [{ type: String }],
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const CollaborationModel = mongoose.model('Collaboration', CollaborationSchema);

class MongoCollaborationRepository {
  async save(collaboration) {
    try {
      const collaborationData = {
        requesterOrgId: collaboration.requesterOrgId,
        requesterOrgName: collaboration.requesterOrgName,
        targetOrgId: collaboration.targetOrgId,
        targetOrgName: collaboration.targetOrgName,
        title: collaboration.title,
        description: collaboration.description,
        status: collaboration.status,
        startDate: collaboration.startDate,
        endDate: collaboration.endDate,
        resources: collaboration.resources,
        notes: collaboration.notes,
      };

      const savedCollaboration = await CollaborationModel.create(collaborationData);
      return this._mapToEntity(savedCollaboration);
    } catch (error) {
      throw new Error(`Error saving collaboration: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const collaboration = await CollaborationModel.findById(id);
      return collaboration ? this._mapToEntity(collaboration) : null;
    } catch (error) {
      throw new Error(`Error finding collaboration by id: ${error.message}`);
    }
  }

  async findByOrganizationId(organizationId) {
    try {
      const collaborations = await CollaborationModel.find({
        $or: [{ requesterOrgId: organizationId }, { targetOrgId: organizationId }],
      }).sort({ createdAt: -1 });
      return collaborations.map((collab) => this._mapToEntity(collab));
    } catch (error) {
      throw new Error(`Error finding collaborations by organization: ${error.message}`);
    }
  }

  async findByStatus(status) {
    try {
      const collaborations = await CollaborationModel.find({ status }).sort({ createdAt: -1 });
      return collaborations.map((collab) => this._mapToEntity(collab));
    } catch (error) {
      throw new Error(`Error finding collaborations by status: ${error.message}`);
    }
  }

  async findBetweenOrganizations(org1Id, org2Id) {
    try {
      const collaborations = await CollaborationModel.find({
        $or: [
          { requesterOrgId: org1Id, targetOrgId: org2Id },
          { requesterOrgId: org2Id, targetOrgId: org1Id },
        ],
      }).sort({ createdAt: -1 });
      return collaborations.map((collab) => this._mapToEntity(collab));
    } catch (error) {
      throw new Error(`Error finding collaborations between organizations: ${error.message}`);
    }
  }

  async update(id, collaborationData) {
    try {
      const updatedCollaboration = await CollaborationModel.findByIdAndUpdate(
        id,
        { ...collaborationData, updatedAt: new Date() },
        { new: true }
      );
      return updatedCollaboration ? this._mapToEntity(updatedCollaboration) : null;
    } catch (error) {
      throw new Error(`Error updating collaboration: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedCollaboration = await CollaborationModel.findByIdAndDelete(id);
      return deletedCollaboration ? this._mapToEntity(deletedCollaboration) : null;
    } catch (error) {
      throw new Error(`Error deleting collaboration: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const collaborations = await CollaborationModel.find().sort({ createdAt: -1 });
      return collaborations.map((collab) => this._mapToEntity(collab));
    } catch (error) {
      throw new Error(`Error finding all collaborations: ${error.message}`);
    }
  }

  async findActiveCollaborations() {
    try {
      const collaborations = await CollaborationModel.find({
        status: { $in: ['accepted', 'active'] },
      }).sort({ createdAt: -1 });
      return collaborations.map((collab) => this._mapToEntity(collab));
    } catch (error) {
      throw new Error(`Error finding active collaborations: ${error.message}`);
    }
  }

  async findPendingCollaborations(organizationId) {
    try {
      const collaborations = await CollaborationModel.find({
        targetOrgId: organizationId,
        status: 'pending',
      }).sort({ createdAt: -1 });
      return collaborations.map((collab) => this._mapToEntity(collab));
    } catch (error) {
      throw new Error(`Error finding pending collaborations: ${error.message}`);
    }
  }

  _mapToEntity(collaborationDoc) {
    return new Collaboration(
      collaborationDoc._id.toString(),
      collaborationDoc.requesterOrgId,
      collaborationDoc.requesterOrgName,
      collaborationDoc.targetOrgId,
      collaborationDoc.targetOrgName,
      collaborationDoc.title,
      collaborationDoc.description,
      collaborationDoc.status,
      collaborationDoc.createdAt,
      collaborationDoc.updatedAt,
      collaborationDoc.startDate,
      collaborationDoc.endDate,
      collaborationDoc.resources,
      collaborationDoc.notes
    );
  }
}

module.exports = MongoCollaborationRepository;
