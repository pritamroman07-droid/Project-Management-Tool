import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskAPI } from '../../api';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await taskAPI.getAll(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchTask = createAsyncThunk('tasks/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await taskAPI.getOne(id);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createTask = createAsyncThunk('tasks/create', async (taskData, { rejectWithValue }) => {
  try {
    const { data } = await taskAPI.create(taskData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await taskAPI.update(id, updates);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try {
    await taskAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const reorderTasks = createAsyncThunk('tasks/reorder', async (payload, { rejectWithValue }) => {
  try {
    await taskAPI.reorder(payload);
    return payload;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    list: [],
    current: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentTask: (state) => { state.current = null; },
    // Optimistic update for Kanban DnD
    updateTaskLocally: (state, action) => {
      const idx = state.list.findIndex((t) => t._id === action.payload._id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
    },
    addTaskFromSocket: (state, action) => {
      const exists = state.list.some((t) => t._id === action.payload._id);
      if (!exists) state.list.push(action.payload);
    },
    removeTaskFromSocket: (state, action) => {
      state.list = state.list.filter((t) => t._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTask.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(createTask.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t._id !== action.payload);
      });
  },
});

export const { clearCurrentTask, updateTaskLocally, addTaskFromSocket, removeTaskFromSocket } = taskSlice.actions;
export default taskSlice.reducer;
