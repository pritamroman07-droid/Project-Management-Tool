const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware factory to log user actions to ActivityLog collection.
 * Usage: router.post('/tasks', protect, logActivity('created_task', 'task'), createTask)
 */
const logActivity = (action, entityType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      // Only log on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && data?.data) {
        try {
          const entity = data.data;
          await ActivityLog.create({
            user: req.user?._id,
            action,
            entityType,
            entityId: entity._id || entity.id || req.params.id,
            entityName: entity.name || entity.title || '',
            project: entity.project || req.params.projectId || req.body.project,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          });
        } catch (err) {
          // Non-blocking — log errors shouldn't break the response
          console.error('Activity log error:', err.message);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = { logActivity };
