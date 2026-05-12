import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  getMe: () => api.get('/auth/me'),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: () => api.post('/auth/2fa/disable'),
};

export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  getTemplates: () => api.get('/projects/templates'),
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (data) => api.post('/tasks/reorder', data),
  addSubtask: (id, data) => api.post(`/tasks/${id}/subtasks`, data),
  toggleSubtask: (id, subtaskId) => api.patch(`/tasks/${id}/subtasks/${subtaskId}`),
  startTimer: (id, data) => api.post(`/tasks/${id}/time/start`, data),
  stopTimer: (id, entryId) => api.patch(`/tasks/${id}/time/${entryId}/stop`),
};

export const commentAPI = {
  getAll: (taskId) => api.get(`/tasks/${taskId}/comments`),
  create: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  update: (taskId, id, data) => api.put(`/tasks/${taskId}/comments/${id}`, data),
  delete: (taskId, id) => api.delete(`/tasks/${taskId}/comments/${id}`),
  addReaction: (taskId, id, emoji) => api.post(`/tasks/${taskId}/comments/${id}/reactions`, { emoji }),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (ids) => api.patch('/notifications/mark-read', { ids }),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTaskTrends: (params) => api.get('/analytics/task-trends', { params }),
  getTeamPerformance: (params) => api.get('/analytics/team-performance', { params }),
  getPriorityDistribution: (params) => api.get('/analytics/priority-distribution', { params }),
  getAiInsights: () => api.get('/analytics/ai-insights'),
};

export const teamAPI = {
  getAll: () => api.get('/teams'),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.patch('/users/change-password', data),
  search: (q) => api.get('/users/search', { params: { q } }),
  getAll: (params) => api.get('/users', { params }),
};
