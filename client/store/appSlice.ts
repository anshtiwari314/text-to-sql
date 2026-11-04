import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ViewState, DatabaseConnection, ChatMessage, ParsedTableSchema } from '@/types';

interface AppState {
  activeView: ViewState;
  connectedDatabases: DatabaseConnection[];
  selectedDbIds: string[];
  activeChatSessionId: string | null;
  activeDbDetail: DatabaseConnection | null;

  activeDbId: string | null;
  schema: string | null;
  schemaDbId: string | null;
  schemaTables: ParsedTableSchema[];
  schemasViewDbId: string | null;

  messages: ChatMessage[];
}

const initialState: AppState = {
  activeView: 'chat',
  connectedDatabases: [],
  selectedDbIds: [],
  activeChatSessionId: null,
  activeDbDetail: null,

  activeDbId: null,
  schema: null,
  schemaDbId: null,
  schemaTables: [],
  schemasViewDbId: null,

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
      if (state.selectedDbIds.length === 0 && action.payload.length > 0) {
        state.selectedDbIds = [action.payload[0].id.toString()];
      }
    },
    toggleSelectedDb: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedDbIds.includes(id)) {
        state.selectedDbIds = state.selectedDbIds.filter((dbId) => dbId !== id);
        if (state.activeDbId === id) {
          state.activeDbId = null;
          state.schema = null;
          state.schemaDbId = null;
          state.schemaTables = [];
        }
      } else {
        state.selectedDbIds.push(id);
      }
    },
    setActiveChatSessionId: (state, action: PayloadAction<string | null>) => {
      state.activeChatSessionId = action.payload;
    },
    setActiveDbId: (state, action: PayloadAction<string | null>) => {
      state.activeDbId = action.payload;
    },
    setActiveDbDetail: (state, action: PayloadAction<DatabaseConnection | null>) => {
      state.activeDbDetail = action.payload;
    },
    setSchemaBundle: (
      state,
      action: PayloadAction<{ dbId: string; schema: string; tables: ParsedTableSchema[] }>
    ) => {
      state.activeDbId = action.payload.dbId;
      state.schema = action.payload.schema;
      state.schemaDbId = action.payload.dbId;
      state.schemaTables = action.payload.tables;
    },
    setSchemasViewDbId: (state, action: PayloadAction<string | null>) => {
      state.schemasViewDbId = action.payload;
    },
    clearSchema: (state) => {
      state.schema = null;
      state.schemaDbId = null;
      state.schemaTables = [];
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    startNewChat: (state) => {
      state.messages = [];
      state.activeChatSessionId = null;
      state.activeView = 'chat';
    },
  },
});

export const {
  setActiveView,
  setConnectedDatabases,
  toggleSelectedDb,
  setActiveChatSessionId,
  setActiveDbId,
  setActiveDbDetail,
  setSchemaBundle,
  setSchemasViewDbId,
  clearSchema,
  addMessage,
  setMessages,
  startNewChat,
} = appSlice.actions;
export default appSlice.reducer;
