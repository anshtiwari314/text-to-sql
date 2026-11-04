"use client";

import { SessionProvider } from "next-auth/react";
import { useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef(store);
  return (
    <SessionProvider>
      <Provider store={storeRef.current}>{children}</Provider>
    </SessionProvider>
  );
}
