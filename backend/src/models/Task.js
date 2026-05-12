const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const timeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number, // in minutes
  note: String,
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['todo', 'inprogress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    labels: [{ type: String, trim: true }],
    startDate: Date,
    dueDate: Date,
    completedAt: Date,
    // Kanban column order position
    position: {
      type: Number,
      default: 0,
    },
    subtasks: [subtaskSchema],
    // File attachments (stored as metadata, actual file stored externally)
    attachments: [
      {
        name: String,
        url: String,
        type: String, // mime type
        size: Number, // bytes
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Task dependencies
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    // Time tracking
    timeEntries: [timeEntrySchema],
    estimatedHours: { type: Number, default: 0 },
    // Recurring task support
    isRecurring: { type: Boolean, default: false },
    recurringPattern: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      interval: { type: Number, default: 1 }, // every N days/weeks/months
      endDate: Date,
    },
    // Milestone flag
    isMilestone: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total logged time in minutes
taskSchema.virtual('totalLoggedTime').get(function () {
  return this.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
});

// Virtual: subtask completion percentage
taskSchema.virtual('subtaskProgress').get(function () {
  if (!this.subtasks.length) return 0;
  const done = this.subtasks.filter((s) => s.completed).length;
  return Math.round((done / this.subtasks.length) * 100);
});

// Indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ project: 1, position: 1 });

module.exports = mongoose.model('Task', taskSchema);
