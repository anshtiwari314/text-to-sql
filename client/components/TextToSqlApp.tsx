"use client";

import React, { useState } from "react";
import { ViewState, DatabaseConnection } from "@/types";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header"; // <-- Import the new Header
import ChatView from "@/components/ChatView";
import ChatHistory from "@/components/ChatHistory";
import DatabaseList from "@/components/DatabaseList";
import ConnectNewDatabase from "@/components/ConnectNewDatabase";
import DatabaseDetails from "@/components/DatabaseDetails";

interface TextToSqlAppProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function TextToSqlApp({ user }: TextToSqlAppProps) {
  const [activeView, setActiveView] = useState<ViewState>("chat");
  const [activeDbDetail, setActiveDbDetail] = useState<DatabaseConnection | null>(null);

  const [connectedDatabases] = useState<DatabaseConnection[]>([
    { id: 1, name: "Production DB", engine: "PostgreSQL", host: "AWS", readOnly: true },
    { id: 2, name: "Local Test", engine: "MySQL", host: "Locally", readOnly: false },
  ]);

  const handleSelectDb = (db: DatabaseConnection) => {
    setActiveDbDetail(db);
    setActiveView("db_details");
  };

  const handleSelectChat = (chatId: number) => {
    console.log("Loading chat ID:", chatId);
    setActiveView("chat");
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans overflow-hidden text-slate-200">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-900 overflow-y-auto">
        
        <Header user={user} databases={connectedDatabases} />

        <div className="flex-1 overflow-y-auto">
          {activeView === "chat" && <ChatView />}
          
          {activeView === "chat_history" && (
            <ChatHistory onSelectChat={handleSelectChat} />
          )}
          
          {activeView === "db_list" && (
            <DatabaseList 
              databases={connectedDatabases} 
              onAddNew={() => setActiveView("new_db")} 
              onSelectDb={handleSelectDb} 
            />
          )}
          
          {activeView === "new_db" && (
            <ConnectNewDatabase 
              onBack={() => setActiveView("db_list")} 
              onSuccess={() => setActiveView("db_list")} 
            />
          )}
          
          {activeView === "db_details" && activeDbDetail && (
            <DatabaseDetails 
              db={activeDbDetail} 
              onBack={() => setActiveView("db_list")} 
            />
          )}
        </div>
      </main>
    </div>
  );
}