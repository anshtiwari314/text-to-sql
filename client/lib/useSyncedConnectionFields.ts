"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildDatabaseUrl, ConnectionFields } from "./buildDatabaseUrl";
import { parseDatabaseUrl } from "./parseDatabaseUrl";

export function useSyncedConnectionFields(initial: ConnectionFields) {
  const [fields, setFields] = useState<ConnectionFields>(initial);
  const [connectionUrl, setConnectionUrl] = useState(() => buildDatabaseUrl(initial));
  const [urlParseError, setUrlParseError] = useState<string | null>(null);
  const fromUrl = useRef(false);

  const syncUrlFromFields = useCallback((next: ConnectionFields) => {
    if (fromUrl.current) {
      fromUrl.current = false;
      return;
    }
    setConnectionUrl(buildDatabaseUrl(next));
    setUrlParseError(null);
  }, []);

  const setField = useCallback(
    (key: keyof ConnectionFields, value: string) => {
      setFields((prev) => {
        const next = { ...prev, [key]: value };
        syncUrlFromFields(next);
        return next;
      });
    },
    [syncUrlFromFields]
  );

  const patchFields = useCallback(
    (patch: Partial<ConnectionFields>) => {
      setFields((prev) => {
        const next = { ...prev, ...patch };
        syncUrlFromFields(next);
        return next;
      });
    },
    [syncUrlFromFields]
  );

  const onConnectionUrlChange = useCallback((raw: string) => {
    setConnectionUrl(raw);
    const trimmed = raw.trim();
    if (!trimmed) {
      setUrlParseError(null);
      return;
    }
    try {
      const parsed = parseDatabaseUrl(trimmed);
      fromUrl.current = true;
      setUrlParseError(null);
      setFields((prev) => ({
        ...prev,
        engine: parsed.engine,
        host: parsed.host,
        port: parsed.port != null ? String(parsed.port) : "",
        db_username: parsed.db_username,
        db_password: parsed.db_password,
        db_name: parsed.db_name,
      }));
    } catch (err) {
      setUrlParseError(err instanceof Error ? err.message : "Invalid URL");
    }
  }, []);

  useEffect(() => {
    console.log("[db-config] synced fields", fields.host, fields.port);
  }, [fields.host, fields.port, fields.engine]);

  return {
    fields,
    setField,
    patchFields,
    connectionUrl,
    onConnectionUrlChange,
    urlParseError,
  };
}
