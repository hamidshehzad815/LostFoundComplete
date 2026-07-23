"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthToken, isAuthenticated, getUser, getUserId } from "@/lib/auth";
import { useSocket } from "@/contexts/SocketContext";
import {
  API_AUTH_URL,
  API_ENDPOINTS,
  API_ITEMS_URL,
  withApiBase,
} from "@/lib/config";
import "./messages.css";

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  trustScore: number;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: User;
  recipient: User;
  content: string;
  itemReference?: {
    _id: string;
    title: string;
    type: string;
    images: string[];
  };
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  conversationId: string;
  otherUser: User;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  itemReference?: {
    _id: string;
    title: string;
    type: string;
    images: string[];
    status: string;
  };
  unreadCount: number;
}

export default function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected, onlineUsers } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [otherUserInfo, setOtherUserInfo] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isItemResolved, setIsItemResolved] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentUser = getUser();
  const currentUserId = getUserId(currentUser);

  const selectedConversationRef = useRef<string | null>(null);
  const currentItemIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>(currentUserId);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    currentItemIdRef.current = currentItemId;
  }, [currentItemId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const toId = (value: unknown) =>
    value == null ? "" : String((value as any)._id || value);

  const getMessageItemId = (message: Message) =>
    toId(message.itemReference?._id || message.itemReference || "");

  const isSameConversation = (
    message: Message,
    otherUserId: string | null,
    itemId: string | null,
  ) => {
    if (!otherUserId) return false;
    const me = currentUserIdRef.current;
    const senderId = toId(message.sender);
    const recipientId = toId(message.recipient);
    const involvesPair =
      (senderId === me && recipientId === otherUserId) ||
      (recipientId === me && senderId === otherUserId);
    if (!involvesPair) return false;

    const messageItemId = getMessageItemId(message) || null;
    return (messageItemId || null) === (itemId || null);
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchConversations();

    const toUserId = searchParams.get("to");
    const itemId = searchParams.get("item");
    if (toUserId) {
      startConversation(toUserId, itemId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (message: Message) => {
      const activeUserId = selectedConversationRef.current;
      const activeItemId = currentItemIdRef.current;
      const me = currentUserIdRef.current;
      const messageId = toId(message._id);

      if (isSameConversation(message, activeUserId, activeItemId)) {
        setMessages((prev) => {
          if (prev.some((existing) => toId(existing._id) === messageId)) {
            return prev;
          }
          return [...prev, message];
        });

        if (toId(message.sender) === activeUserId && activeUserId) {
          socket.emit("message:read", {
            otherUserId: activeUserId,
            itemId: activeItemId || null,
          });
        }
      }

      // Keep the sidebar fresh for both participants without a full reload.
      fetchConversations();
    };

    const onTypingStart = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set([...prev, String(userId)]));
    };

    const onTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(String(userId));
        return updated;
      });
    };

    const onMessageRead = ({ conversationId }: { conversationId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversationId === conversationId ? { ...msg, isRead: true } : msg,
        ),
      );
      fetchConversations();
    };

    socket.on("message:received", onNewMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("message:read", onMessageRead);
    socket.on("error", (error) => console.error("Socket error:", error));

    return () => {
      socket.off("message:received", onNewMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("message:read", onMessageRead);
      socket.off("error");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(API_ENDPOINTS.MESSAGES_CONVERSATIONS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (userId: string, itemId?: string | null) => {
    try {
      const token = getAuthToken();

      const messagesUrl = itemId
        ? `${API_ENDPOINTS.MESSAGES}/${userId}?itemId=${itemId}`
        : `${API_ENDPOINTS.MESSAGES}/${userId}`;

      const messagesResponse = await fetch(messagesUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userResponse = await fetch(`${API_AUTH_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (itemId) {
        setCurrentItemId(itemId);
        const itemResponse = await fetch(`${API_ITEMS_URL}/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          setIsItemResolved(itemData.data.status === "resolved");
        }
      } else {
        setCurrentItemId(null);
      }

      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        setMessages(data.data || []);
        setSelectedConversation(userId);

        if (socket) {
          socket.emit("message:read", {
            otherUserId: userId,
            itemId: itemId || null,
          });
        }

        setConversations((prev) =>
          prev.map((conv) =>
            conv.otherUser._id === userId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setOtherUserInfo(userData.data);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const fetchMessages = async (otherUserId: string, itemId?: string | null) => {
    try {
      const token = getAuthToken();

      const messagesUrl = itemId
        ? `${API_ENDPOINTS.MESSAGES}/${otherUserId}?itemId=${itemId}`
        : `${API_ENDPOINTS.MESSAGES}/${otherUserId}`;

      const messagesResponse = await fetch(messagesUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userResponse = await fetch(`${API_AUTH_URL}/user/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        setMessages(data.data || []);
        setSelectedConversation(otherUserId);
        setCurrentItemId(itemId || null);

        if (socket) {
          socket.emit("message:read", { otherUserId, itemId: itemId || null });
        }

        setConversations((prev) =>
          prev.map((conv) =>
            conv.otherUser._id === otherUserId
              ? { ...conv, unreadCount: 0 }
              : conv,
          ),
        );
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setOtherUserInfo(userData.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !socket || !isConnected) {
      return;
    }

    const content = messageInput.trim();
    setSending(true);
    setMessageInput("");

    socket.emit("message:send", {
      recipientId: selectedConversation,
      content,
      itemId: currentItemId || null,
    });

    setSending(false);
    socket.emit("typing:stop", { recipientId: selectedConversation });
  };

  const hideConversation = async (
    otherUserId: string,
    itemId: string | null = null,
  ) => {
    try {
      const token = getAuthToken();
      const hideUrl = itemId
        ? `${API_ENDPOINTS.MESSAGES}/${otherUserId}/hide?itemId=${itemId}`
        : `${API_ENDPOINTS.MESSAGES}/${otherUserId}/hide`;

      const response = await fetch(hideUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setConversations((prev) =>
          prev.filter(
            (conv) =>
              !(
                conv.otherUser._id === otherUserId &&
                conv.conversationId.includes(itemId || "")
              ),
          ),
        );

        if (selectedConversation === otherUserId && currentItemId === itemId) {
          setSelectedConversation(null);
          setCurrentItemId(null);
          setMessages([]);
          setIsItemResolved(false);
        }
      }
    } catch (error) {
      console.error("Error hiding conversation:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (socket && selectedConversation) {
      socket.emit("typing:start", { recipientId: selectedConversation });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { recipientId: selectedConversation });
      }, 1000);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const formatSidebarTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const shouldShowDayDivider = (index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].createdAt).toDateString();
    const previous = new Date(messages[index - 1].createdAt).toDateString();
    return current !== previous;
  };

  const formatDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const selectedConversationData = conversations.find((c) => {
    if (c.otherUser._id !== selectedConversation) return false;
    const parts = c.conversationId.split("_");
    const convItemId = parts.length === 3 ? parts[2] : null;
    return (convItemId || null) === (currentItemId || null);
  });

  const relatedItem =
    selectedConversationData?.itemReference ||
    messages.find((msg) => msg.itemReference)?.itemReference ||
    null;

  const selectedUser =
    selectedConversationData?.otherUser || otherUserInfo;
  const isOtherUserOnline = selectedUser && onlineUsers.has(selectedUser._id);
  const isOtherUserTyping = selectedUser && typingUsers.has(selectedUser._id);

  if (loading) {
    return (
      <main className="page messages-page">
        <div className="loading-state">
          <div className="spinner" />
          <p className="muted">Loading messages...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page messages-page">
        <div className="messages-container">
          <div className="conversations-sidebar">
            <div className="sidebar-header">
              <span className="eyebrow">Inbox</span>
              <h2 className="section-title">Messages</h2>
            </div>

            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="empty-conversations">
                  <p>No messages yet</p>
                  <small>Start a conversation from item details</small>
                </div>
              ) : (
                conversations.map((conv) => {
                  if (!conv.otherUser) return null;

                  const convParts = conv.conversationId.split("_");
                  const convItemId =
                    convParts.length === 3 ? convParts[2] : null;

                  return (
                    <div
                      key={conv.conversationId}
                      className={`conversation-item ${
                        selectedConversation === conv.otherUser._id &&
                        currentItemId === convItemId
                          ? "active"
                          : ""
                      }`}
                    >
                      <div
                        className="conversation-content"
                        onClick={() =>
                          fetchMessages(conv.otherUser._id, convItemId)
                        }
                      >
                        <div className="conversation-avatar">
                          {conv.otherUser.profilePicture ? (
                            <img
                              src={
                                conv.otherUser.profilePicture.startsWith("http")
                                  ? conv.otherUser.profilePicture
                                  : withApiBase(conv.otherUser.profilePicture)
                              }
                              alt={conv.otherUser.username}
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {conv.otherUser.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="conversation-details">
                          <div className="conversation-header">
                            <span className="conversation-name">
                              {conv.otherUser.username}
                            </span>
                            <span className="conversation-time">
                              {formatSidebarTime(conv.lastMessage.createdAt)}
                            </span>
                          </div>
                          {conv.itemReference && (
                            <div className="conversation-item-ref">
                              <span className="conversation-item-name">
                                {conv.itemReference.title}
                              </span>
                              {conv.itemReference.status === "resolved" && (
                                <span className="resolved-badge">
                                  Resolved
                                </span>
                              )}
                            </div>
                          )}
                          <div className="conversation-preview">
                            <span
                              className={conv.unreadCount > 0 ? "unread" : ""}
                            >
                              {conv.lastMessage.isFromMe ? "You: " : ""}
                              {conv.lastMessage.content.length > 40
                                ? `${conv.lastMessage.content.substring(0, 40)}...`
                                : conv.lastMessage.content}
                            </span>
                          </div>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                      <button
                        className="delete-conversation-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              "Hide this conversation? Messages won't be deleted from database.",
                            )
                          ) {
                            hideConversation(conv.otherUser._id, convItemId);
                          }
                        }}
                        title="Hide conversation"
                      >
                        Hide
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="chat-area">
            {!selectedConversation ? (
              <div className="no-chat-selected">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the left to start messaging</p>
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <div className="chat-user-info">
                    <div className="chat-user-avatar">
                      {selectedUser?.profilePicture ? (
                        <img
                          src={
                            selectedUser.profilePicture.startsWith("http")
                              ? selectedUser.profilePicture
                              : withApiBase(selectedUser.profilePicture)
                          }
                          alt={selectedUser.username}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {selectedUser?.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3>{selectedUser?.username}</h3>
                      <p className="user-status">
                        {isOtherUserOnline ? "Online" : "Offline"}
                        {isOtherUserTyping && " • typing..."}
                      </p>
                    </div>
                  </div>
                  {relatedItem && (
                    <button
                      type="button"
                      className="chat-item-chip"
                      onClick={() =>
                        router.push(`/item/${relatedItem._id}`)
                      }
                      title="View related item"
                    >
                      {relatedItem.images?.[0] && (
                        <img
                          src={withApiBase(relatedItem.images[0])}
                          alt=""
                        />
                      )}
                      <span className="chat-item-chip-text">
                        <span className="chat-item-chip-label">
                          About this {relatedItem.type} item
                        </span>
                        <span className="chat-item-chip-title">
                          {relatedItem.title}
                        </span>
                      </span>
                    </button>
                  )}
                </div>

                <div className="messages-list">
                  {messages.map((msg, index) => (
                    <div key={msg._id} className="message-block">
                      {shouldShowDayDivider(index) && (
                        <div className="day-divider">
                          <span>{formatDayLabel(msg.createdAt)}</span>
                        </div>
                      )}
                      <div
                        className={`message ${
                          toId(msg.sender) === currentUserId
                            ? "sent"
                            : "received"
                        }`}
                      >
                        {toId(msg.sender) !== currentUserId && (
                          <div className="message-avatar">
                            {msg.sender.profilePicture ? (
                              <img
                                src={
                                  msg.sender.profilePicture.startsWith("http")
                                    ? msg.sender.profilePicture
                                    : withApiBase(msg.sender.profilePicture)
                                }
                                alt={msg.sender.username}
                              />
                            ) : (
                              <div className="avatar-placeholder-small">
                                {msg.sender.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="message-content">
                          <div className="message-bubble">
                            <p className="message-text">{msg.content}</p>
                          </div>
                          <div className="message-meta">
                            <span className="message-time">
                              {formatTime(msg.createdAt)}
                            </span>
                            {toId(msg.sender) === currentUserId && (
                              <span className="message-status">
                                {msg.isRead ? "Read" : "Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {isItemResolved ? (
                  <div className="chat-closed-notice">
                    <div className="notice-content">
                      <h4>This conversation is closed</h4>
                      <p>
                        The item has been marked as resolved. You can view
                        previous messages but cannot send new ones.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="message-input-container">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      disabled={!isConnected || sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || !isConnected || sending}
                    >
                      {sending ? "Sending" : "Send"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </main>
  );
}
