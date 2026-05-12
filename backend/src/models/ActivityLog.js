const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'created_task', 'updated_project', 'deleted_comment', 'moved_task'
    },
    entityType: {
      type: String,
      enum: ['task', 'project', 'comment', 'team', 'user', 'notification'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityName: {
      type: String,
      default: '',
    },
    // What changed (before/after for audit trail)
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Related project for filtering
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    // IP address for security audit
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
