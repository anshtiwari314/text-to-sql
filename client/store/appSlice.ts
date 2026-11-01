import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ViewState, DatabaseConnection } from '@/types';

interface AppState {
  activeView: ViewState;
  connectedDatabases: DatabaseConnection[];
  selectedDbIds: string[]; // Stores the IDs of the databases checked in the Header
  activeChatId: string | null; // Tracks the active 
  activeDbDetail: DatabaseConnection | null;
}

const initialState: AppState = {
  activeView: "chat",
  connectedDatabases: [],
  selectedDbIds: [],
  activeChatId: null,
  activeDbDetail: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<ViewState>) => {
      state.activeView = action.payload;
    },
    setConnectedDatabases: (state, action: PayloadAction<DatabaseConnection[]>) => {
      state.connectedDatabases = action.payload;
      // Auto-select the first database if none are selected yet
      if (state.selectedDbIds.length === 0 && action.payload.length > 0) {
        state.selectedDbIds = [action.payload[0].id.toString()];
      }
    },
    toggleSelectedDb: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedDbIds.includes(id)) {
        state.selectedDbIds = state.selectedDbIds.filter(dbId => dbId !== id);
      } else {
        state.selectedDbIds.push(id);
      }
    },
    setActiveChatId: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
    },

    setActiveDbDetail: (state, action: PayloadAction<DatabaseConnection | null>) => {
      state.activeDbDetail = action.payload;
    }
  },
});

export const { setActiveView, setConnectedDatabases, toggleSelectedDb, setActiveChatId,setActiveDbDetail } = appSlice.actions;
export default appSlice.reducer;