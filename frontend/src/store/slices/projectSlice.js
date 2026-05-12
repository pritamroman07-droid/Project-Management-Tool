import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectAPI } from '../../api';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await projectAPI.getAll(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch projects');
  }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await projectAPI.getOne(id);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const { data } = await projectAPI.create(projectData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create project');
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await projectAPI.update(id, updates);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await projectAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: { list: [], current: null, pagination: null, loading: false, error: null },
  reducers: {
    clearCurrentProject: (state) => { state.current = null; },
    updateProjectLocally: (state, action) => {
      const idx = state.list.findIndex((p) => p._id === action.payload._id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (state.current?._id === action.payload._id) state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchProject.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(createProject.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearCurrentProject, updateProjectLocally } = projectSlice.actions;
export default projectSlice.reducer;
