import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ViewState, DatabaseConnection, ChatMessage } from '@/types';

interface AppState {
  activeView: ViewState;
  connectedDatabases: DatabaseConnection[];
  selectedDbIds: string[]; // Stores the IDs of the databases checked in the Header
  activeChatId: string | null; // Tracks the active chat
  activeDbDetail: DatabaseConnection | null;

  // --- text-to-SQL flow ---
  activeDbId: string | null;    // the database the chat talks to (null = nothing connected)
  schema: string | null;        // schema text verified + cached from Flask (/api/schema)
  schemaDbId: string | null;    // which database that schema belongs to
  messages: ChatMessage[];      // the current chat (also sent to Flask as "history")
}

const initialState: AppState = {
  activeView: "chat",
  connectedDatabases: [],
  selectedDbIds: [],
  activeChatId: null,
  activeDbDetail: null,

  activeDbId: null,
  schema: null,
  schemaDbId: null,
  messages: [],
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
        // Deselecting the DB the chat was tied to — drop cached schema only then
        if (state.activeDbId === id) {
          state.activeDbId = null;
          state.schema = null;
          state.schemaDbId = null;
        }
      } else {
        state.selectedDbIds.push(id);
      }
    },
    setActiveChatId: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
    },

    setActiveDbDetail: (state, action: PayloadAction<DatabaseConnection | null>) => {
      state.activeDbDetail = action.payload;
    },

    // Store the schema we got back from Flask after connecting.
    // This also makes that database the active one for the chat.
    setSchema: (state, action: PayloadAction<{ dbId: string; schema: string }>) => {
      state.activeDbId = action.payload.dbId;
      state.schema = action.payload.schema;
      state.schemaDbId = action.payload.dbId;
    },
    // Keep the active database, throw away the schema (forces a reload)
    clearSchema: (state) => {
      state.schema = null;
      state.schemaDbId = null;
    },

    // Add a chat message (user question, AI answer, or clarification question)
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
  },
});

export const {
  setActiveView,
  setConnectedDatabases,
  toggleSelectedDb,
  setActiveChatId,
  setActiveDbDetail,
  setSchema,
  clearSchema,
  addMessage,
} = appSlice.actions;
export default appSlice.reducer;
