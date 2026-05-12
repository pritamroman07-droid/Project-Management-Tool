import { createSlice } from '@reduxjs/toolkit';

// Apply theme immediately on store initialization to avoid flash of wrong theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.classList.toggle('dark', savedTheme === 'dark');

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: savedTheme,
    sidebarOpen: true,
    sidebarCollapsed: false,
    activeModal: null,
    modalData: null,
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      document.documentElement.classList.toggle('dark', action.payload === 'dark');
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleSidebarCollapse: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    openModal: (state, action) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, toggleSidebarCollapse, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
