"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setActiveView,
  setConnectedDatabases,
  setActiveDbDetail,
  setSchema,
  clearSchema,
} from "@/store/appSlice";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatView from "@/components/ChatView";
import ChatHistory from "@/components/ChatHistory";
import DatabaseList from "@/components/DatabaseList";
import ConnectNewDatabase from "@/components/ConnectNewDatabase";
import DatabaseDetails from "@/components/DatabaseDetails";
import { DatabaseConnection } from "@/types";

interface TextToSqlAppProps {
  user?: { name?: string | null; email?: string | null; image?: string | null; };
}

export default function TextToSqlApp({ user }: TextToSqlAppProps) {
  const dispatch = useDispatch();

  // Read state from Redux
  const activeView = useSelector((state: RootState) => state.app.activeView);
  const connectedDatabases = useSelector((state: RootState) => state.app.connectedDatabases);
  const activeDbDetail = useSelector((state: RootState) => state.app.activeDbDetail);
  const activeDbId = useSelector((state: RootState) => state.app.activeDbId);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Fetch databases from Postgres on component mount
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch('/api/databases');
        if (response.ok) {
          const data = await response.json();
          dispatch(setConnectedDatabases(data.databases));
        }
      } catch (error) {
        console.error("Failed to fetch databases", error);
      }
    };
    fetchDatabases();
  }, [dispatch]);

  // ---------------------------------------------------------------
  // SELECT A DATABASE  ->  verify it + load its schema
  //   1. Next.js /api/schema  -> Flask /api/schema
  //   2. Flask connects to the user's DB, returns the schema text
  //   3. We save that text in Redux; the chat sends it back later
  // We stay on this page, so the database can still be reconfigured.
  // ---------------------------------------------------------------
  const handleSelectDatabase = async (db: DatabaseConnection) => {
    setIsConnecting(true);
    setConnectError(null);
    dispatch(clearSchema());

    try {
      const response = await fetch('/api/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId: db.id }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not connect to this database");

      // This database is now the one the chat talks to
      dispatch(setSchema({ dbId: db.id.toString(), schema: data.schema }));
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Could not connect to this database");
    } finally {
      setIsConnecting(false);
    }
  };

  // "Configure" opens the details page; it does not load a schema or start a chat
  const handleConfigureDatabase = (db: DatabaseConnection) => {
    dispatch(setActiveDbDetail(db));
    dispatch(setActiveView("db_details"));
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans overflow-hidden text-slate-200">
      <Sidebar activeView={activeView} setActiveView={(view) => dispatch(setActiveView(view))} />

      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-900 overflow-y-auto">
        <Header user={user} />

        <div className="flex-1 overflow-y-auto relative">

          {activeView === "chat" && <ChatView />}

          {activeView === "chat_history" && (
            <ChatHistory
              onSelectChat={() => {
                dispatch(setActiveView("chat"));
              }}
            />
          )}

          {activeView === "db_list" && (
            <DatabaseList
              databases={connectedDatabases}
              onAddNew={() => dispatch(setActiveView("new_db"))}
              onSelectDb={handleSelectDatabase}
              onConfigureDb={handleConfigureDatabase}
              isConnecting={isConnecting}
              connectError={connectError}
              activeDbId={activeDbId}
            />
          )}

          {activeView === "new_db" && (
            <ConnectNewDatabase
              onBack={() => dispatch(setActiveView("db_list"))}
              onSuccess={() => {
                // Re-fetch so the new database appears in the list
                fetch('/api/databases')
                  .then((response) => response.json())
                  .then((data) => dispatch(setConnectedDatabases(data.databases)))
                  .catch((error) => console.error("Failed to refresh databases", error));
                dispatch(setActiveView("db_list"));
              }}
            />
          )}

          {activeView === "db_details" && activeDbDetail && (
            <DatabaseDetails
              db={activeDbDetail}
              onBack={() => dispatch(setActiveView("db_list"))}
              activeDbId={activeDbId}
              onSaved={() => {
                // Re-fetch so name/engine changes show up in the list
                fetch('/api/databases')
                  .then((response) => response.json())
                  .then((data) => dispatch(setConnectedDatabases(data.databases)))
                  .catch((error) => console.error("Failed to refresh databases", error));
              }}
            />
          )}

        </div>
      </main>
    </div>
  );
}
