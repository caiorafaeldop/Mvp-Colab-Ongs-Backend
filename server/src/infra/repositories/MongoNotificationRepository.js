// Interface removida na limpeza
const Notification = require('../../domain/entities/Notification');
const mongoose = require('mongoose');

// Schema do Notification
const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'collaboration', 'system'],
      default: 'info',
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    relatedEntityId: { type: String, default: null },
    relatedEntityType: {
      type: String,
      enum: ['collaboration', 'user', 'product', 'file'],
      default: null,
    },
    actionUrl: { type: String, default: null },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.model('Notification', NotificationSchema);

class MongoNotificationRepository {
  async save(notification) {
    try {
      const notificationData = {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        readAt: notification.readAt,
        relatedEntityId: notification.relatedEntityId,
        relatedEntityType: notification.relatedEntityType,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
      };

      const savedNotification = await NotificationModel.create(notificationData);
      return this._mapToEntity(savedNotification);
    } catch (error) {
      throw new Error(`Error saving notification: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const notification = await NotificationModel.findById(id);
      return notification ? this._mapToEntity(notification) : null;
    } catch (error) {
      throw new Error(`Error finding notification by id: ${error.message}`);
    }
  }

  async findByUserId(userId) {
    try {
      const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
      return notifications.map((notif) => this._mapToEntity(notif));
    } catch (error) {
      throw new Error(`Error finding notifications by user: ${error.message}`);
    }
  }

  async findByType(type) {
    try {
      const notifications = await NotificationModel.find({ type }).sort({ createdAt: -1 });
      return notifications.map((notif) => this._mapToEntity(notif));
    } catch (error) {
      throw new Error(`Error finding notifications by type: ${error.message}`);
    }
  }

  async findUnreadByUserId(userId) {
    try {
      const notifications = await NotificationModel.find({
        userId,
        isRead: false,
      }).sort({ createdAt: -1 });
      return notifications.map((notif) => this._mapToEntity(notif));
    } catch (error) {
      throw new Error(`Error finding unread notifications: ${error.message}`);
    }
  }

  async markAsRead(id) {
    try {
      const updatedNotification = await NotificationModel.findByIdAndUpdate(
        id,
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      );
      return updatedNotification ? this._mapToEntity(updatedNotification) : null;
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await NotificationModel.updateMany(
        { userId, isRead: false },
        {
          isRead: true,
          readAt: new Date(),
        }
      );
      return result.modifiedCount;
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  async update(id, notificationData) {
    try {
      const updatedNotification = await NotificationModel.findByIdAndUpdate(
        id,
        { ...notificationData, updatedAt: new Date() },
        { new: true }
      );
      return updatedNotification ? this._mapToEntity(updatedNotification) : null;
    } catch (error) {
      throw new Error(`Error updating notification: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedNotification = await NotificationModel.findByIdAndDelete(id);
      return deletedNotification ? this._mapToEntity(deletedNotification) : null;
    } catch (error) {
      throw new Error(`Error deleting notification: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const notifications = await NotificationModel.find().sort({ createdAt: -1 });
      return notifications.map((notif) => this._mapToEntity(notif));
    } catch (error) {
      throw new Error(`Error finding all notifications: ${error.message}`);
    }
  }

  async findByDateRange(startDate, endDate) {
    try {
      const notifications = await NotificationModel.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }).sort({ createdAt: -1 });
      return notifications.map((notif) => this._mapToEntity(notif));
    } catch (error) {
      throw new Error(`Error finding notifications by date range: ${error.message}`);
    }
  }

  _mapToEntity(notificationDoc) {
    return new Notification(
      notificationDoc._id.toString(),
      notificationDoc.userId,
      notificationDoc.title,
      notificationDoc.message,
      notificationDoc.type,
      notificationDoc.isRead,
      notificationDoc.createdAt,
      notificationDoc.readAt,
      notificationDoc.relatedEntityId,
      notificationDoc.relatedEntityType,
      notificationDoc.actionUrl,
      notificationDoc.metadata
    );
  }
}

module.exports = MongoNotificationRepository;
