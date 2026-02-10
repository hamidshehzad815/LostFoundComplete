"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, logout, getUser, getAuthToken } from "@/lib/auth";
import { useSocket } from "@/contexts/SocketContext";
import { API_ENDPOINTS } from "@/lib/config";
import "./Navigation.css";

export default function Navigation() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUser(getUser());

    if (isAuthenticated()) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [pathname]);

  useEffect(() => {
    if (socket && isAuth) {
      const handleNewMessage = (message: any) => {
        const currentUserId = user?.id;
        if (
          message.recipient._id === currentUserId &&
          pathname !== "/messages"
        ) {
          setHasNewMessage(true);
          fetchUnreadCount();
        }
      };

      const handleMessageRead = () => {
        fetchUnreadCount();
      };

      socket.on("message:received", handleNewMessage);
      socket.on("message:read", handleMessageRead);

      return () => {
        socket.off("message:received", handleNewMessage);
        socket.off("message:read", handleMessageRead);
      };
    }
  }, [socket, isAuth, pathname, user]);

  useEffect(() => {
    if (pathname === "/messages") {
      setHasNewMessage(false);
    }
  }, [pathname]);

  const fetchUnreadCount = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.MESSAGES_UNREAD_COUNT, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.data?.unreadCount || 0;
        setUnreadCount(count);
        if (count === 0) {
          setHasNewMessage(false);
        }
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleMessagesClick = () => {
    setHasNewMessage(false);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setIsAuth(false);
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          <span className="navbar-icon">🔍</span>
          Lost & Found
        </Link>

        <div className="navbar-menu">
          {isAuth ? (
            <>
              <Link href="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link href="/explore" className="nav-link">
                Explore
              </Link>
              <Link href="/saved" className="nav-link">
                Saved
              </Link>
              <Link href="/my-items" className="nav-link">
                My Items
              </Link>
              <Link
                href="/messages"
                className="nav-link messages-link"
                onClick={handleMessagesClick}
              >
                Messages
                {(hasNewMessage || unreadCount > 0) && (
                  <span className="nav-notification-dot"></span>
                )}
              </Link>
              <Link href="/profile" className="nav-link">
                Profile
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="login-link">
                Login
              </Link>
              <Link href="/signup" className="signup-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
