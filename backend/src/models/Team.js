const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    avatar: { type: String, default: '' },
    color: { type: String, default: '#6366f1' },
    // Pending invitations
    invitations: [
      {
        email: String,
        token: String,
        role: { type: String, enum: ['manager', 'member'], default: 'member' },
        expiresAt: Date,
      },
    ],
    settings: {
      isPublic: { type: Boolean, default: false },
      allowMemberInvite: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

teamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

module.exports = mongoose.model('Team', teamSchema);
