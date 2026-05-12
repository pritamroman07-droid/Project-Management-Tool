const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_completed',
        'task_comment',
        'task_mentioned',
        'task_due_soon',
        'task_overdue',
        'project_invite',
        'project_update',
        'team_invite',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // Deep link to the relevant resource
    link: { type: String, default: '' },
    // Reference to relevant entities
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
