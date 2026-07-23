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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUser(getUser());
    setMobileOpen(false);

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
        if (count === 0) setHasNewMessage(false);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setIsAuth(false);
    setUser(null);
    setMobileOpen(false);
    router.push("/");
  };

  const navClass = (href: string) =>
    `nav-link${pathname === href || pathname.startsWith(href + "/") ? " active" : ""}`;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">Lost & Found</span>
        </Link>

        <button
          type="button"
          className={`nav-toggle${mobileOpen ? " open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-panel${mobileOpen ? " open" : ""}`}>
          {isAuth ? (
            <>
              <div className="nav-links">
                <Link href="/dashboard" className={navClass("/dashboard")}>
                  Dashboard
                </Link>
                <Link href="/explore" className={navClass("/explore")}>
                  Explore
                </Link>
                <Link href="/saved" className={navClass("/saved")}>
                  Saved
                </Link>
                <Link href="/my-items" className={navClass("/my-items")}>
                  My Items
                </Link>
                <Link
                  href="/messages"
                  className={`${navClass("/messages")} messages-link`}
                  onClick={() => setHasNewMessage(false)}
                >
                  Messages
                  {(hasNewMessage || unreadCount > 0) && (
                    <span className="nav-dot" />
                  )}
                </Link>
                <Link href="/profile" className={navClass("/profile")}>
                  Profile
                </Link>
              </div>
              <div className="nav-actions">
                <span className="nav-user">{user?.username}</span>
                <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm">
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="nav-actions guest">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
