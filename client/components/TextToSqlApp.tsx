"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { 
  setActiveView, 
  setConnectedDatabases, 
  setActiveChatId ,setActiveDbDetail
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

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans overflow-hidden text-slate-200">
      <Sidebar activeView={activeView} setActiveView={(view) => dispatch(setActiveView(view))} />

      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-900 overflow-y-auto">
        <Header user={user} />

        <div className="flex-1 overflow-y-auto relative">
          
          {activeView === "chat" && <ChatView />}
          
          {activeView === "chat_history" && (
            <ChatHistory 
              onSelectChat={(chatId) => {
                dispatch(setActiveChatId(chatId.toString()));
                dispatch(setActiveView("chat"));
              }} 
            />
          )}
          
          {activeView === "db_list" && (
            <DatabaseList 
              databases={connectedDatabases} 
              onAddNew={() => dispatch(setActiveView("new_db"))} 
              onSelectDb={(db: DatabaseConnection) => {
                dispatch(setActiveDbDetail(db));
                dispatch(setActiveView("db_details"));
              }} 
            />
          )}
          
          {activeView === "new_db" && (
            <ConnectNewDatabase 
              onBack={() => dispatch(setActiveView("db_list"))} 
              onSuccess={() => {
                // Optionally trigger a re-fetch of databases here
                dispatch(setActiveView("db_list"));
              }} 
            />
          )}

          {activeView === "db_details" && activeDbDetail && (
            <DatabaseDetails 
              db={activeDbDetail} 
              onBack={() => dispatch(setActiveView("db_list"))} 
            />
          )}
          
        </div>
      </main>
    </div>
  );
}