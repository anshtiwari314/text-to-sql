"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setActiveView,
  setConnectedDatabases,
  setActiveDbDetail,
  setSchemaBundle,
  setSchemasViewDbId,
  clearSchema,
  setMessages,
  setActiveChatSessionId,
  setActiveDbId,
  startNewChat,
} from "@/store/appSlice";
import { parseSchemaDdl } from "@/lib/parseSchemaDdl";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatView from "@/components/ChatView";
import ChatHistory from "@/components/ChatHistory";
import DatabaseList from "@/components/DatabaseList";
import DatabaseSchemasView from "@/components/DatabaseSchemasView";
import ConnectNewDatabase from "@/components/ConnectNewDatabase";
import DatabaseDetails from "@/components/DatabaseDetails";
import { DatabaseConnection } from "@/types";
import LandingGlow from "@/components/LandingGlow";

interface TextToSqlAppProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export default function TextToSqlApp({ user }: TextToSqlAppProps) {
  const dispatch = useDispatch();
  const activeView = useSelector((state: RootState) => state.app.activeView);
  const connectedDatabases = useSelector((state: RootState) => state.app.connectedDatabases);
  const activeDbDetail = useSelector((state: RootState) => state.app.activeDbDetail);
  const schemaTables = useSelector((state: RootState) => state.app.schemaTables);
  const schema = useSelector((state: RootState) => state.app.schema);
  const schemasViewDbId = useSelector((state: RootState) => state.app.schemasViewDbId);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/databases")
      .then((r) => r.json())
      .then((data) => dispatch(setConnectedDatabases(data.databases)))
      .catch((e) => console.error("Failed to fetch databases", e));
  }, [dispatch]);

  const loadSchemaForDb = async (db: DatabaseConnection, goToSchemasView: boolean) => {
    setIsConnecting(true);
    setConnectError(null);
    dispatch(clearSchema());
    dispatch(setSchemasViewDbId(db.id));

    try {
      const response = await fetch("/api/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseId: db.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load schema");

      const tables = parseSchemaDdl(data.schema);
      dispatch(
        setSchemaBundle({
          dbId: db.id.toString(),
          schema: data.schema,
          tables,
        })
      );
      if (goToSchemasView) dispatch(setActiveView("db_schemas"));
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Could not load schema");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenConfiguration = (db: DatabaseConnection) => {
    dispatch(setActiveDbDetail(db));
    dispatch(setActiveView("db_details"));
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load chat");

      dispatch(setActiveChatSessionId(data.chat.id));
      dispatch(setActiveDbId(data.chat.database_id));
      dispatch(setMessages(data.messages));
      dispatch(setActiveView("chat"));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-50">
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === "chat") dispatch(startNewChat());
          else dispatch(setActiveView(view));
        }}
      />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-950">
        <LandingGlow />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <Header user={user} />

        <div className="relative flex-1 overflow-y-auto">
          {activeView === "chat" && <ChatView />}

          {activeView === "chat_history" && <ChatHistory onSelectChat={handleSelectChat} />}

          {activeView === "db_list" && (
            <DatabaseList
              databases={connectedDatabases}
              onAddNew={() => dispatch(setActiveView("new_db"))}
              onOpenConfiguration={handleOpenConfiguration}
              isConnecting={isConnecting}
              connectError={connectError}
            />
          )}

          {activeView === "db_schemas" && (
            <DatabaseSchemasView
              databases={connectedDatabases}
              focusDbId={schemasViewDbId}
              schemaTables={schemaTables}
              schemaRaw={schema}
              isLoading={isConnecting}
              error={connectError}
              onSelectDatabaseCard={(db) => void loadSchemaForDb(db, false)}
            />
          )}

          {activeView === "new_db" && (
            <ConnectNewDatabase
              onBack={() => dispatch(setActiveView("db_list"))}
              onSuccess={() => {
                fetch("/api/databases")
                  .then((r) => r.json())
                  .then((data) => dispatch(setConnectedDatabases(data.databases)));
                dispatch(setActiveView("db_list"));
              }}
            />
          )}

          {activeView === "db_details" && activeDbDetail && (
            <DatabaseDetails
              db={activeDbDetail}
              onBack={() => dispatch(setActiveView("db_list"))}
              activeDbId={schemasViewDbId}
              onSaved={() => {
                fetch("/api/databases")
                  .then((r) => r.json())
                  .then((data) => dispatch(setConnectedDatabases(data.databases)));
              }}
            />
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
