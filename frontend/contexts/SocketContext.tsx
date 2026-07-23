"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken, isAuthenticated } from "@/lib/auth";
import { SOCKET_URL } from "@/lib/config";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [authEpoch, setAuthEpoch] = useState(0);

  const bumpAuth = useCallback(() => {
    setAuthEpoch((value) => value + 1);
  }, []);

  useEffect(() => {
    const onAuthChanged = () => bumpAuth();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "authToken" || event.key === "user") {
        bumpAuth();
      }
    };

    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [bumpAuth]);

  useEffect(() => {
    const token = getAuthToken();
    const authed = Boolean(token && isAuthenticated());

    if (!authed) {
      setSocket((prev) => {
        if (prev) prev.close();
        return null;
      });
      setIsConnected(false);
      setOnlineUsers(new Set());
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 20,
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    newSocket.on("user:online", ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, String(userId)]));
    });

    newSocket.on("user:offline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(String(userId));
        return updated;
      });
    });

    setSocket((prev) => {
      if (prev) prev.close();
      return newSocket;
    });

    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, [authEpoch]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
