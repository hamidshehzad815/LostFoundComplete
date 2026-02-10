"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthToken, isAuthenticated, getUser } from "@/lib/auth";
import Navigation from "@/components/Navigation";
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

export default function Messages() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected, onlineUsers } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [otherUserInfo, setOtherUserInfo] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [itemReference, setItemReference] = useState<any>(null);
  const [isItemResolved, setIsItemResolved] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentUser = getUser();

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
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("message:received", handleNewMessage);
      socket.on("typing:start", handleTypingStart);
      socket.on("typing:stop", handleTypingStop);
      socket.on("message:read", handleMessageRead);
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return () => {
        socket.off("message:received");
        socket.off("typing:start");
        socket.off("typing:stop");
        socket.off("message:read");
        socket.off("error");
      };
    }
  }, [socket, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
          setItemReference(itemData.data);
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

        const messagesWithItem = data.data?.filter(
          (msg: Message) => msg.itemReference,
        );
        if (messagesWithItem && messagesWithItem.length > 0 && !itemId) {
          const firstItemRef = messagesWithItem[0].itemReference;
          if (firstItemRef) {
            const itemResponse = await fetch(
              `${API_ITEMS_URL}/${firstItemRef._id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (itemResponse.ok) {
              const itemData = await itemResponse.json();
              setItemReference(itemData.data);
              setIsItemResolved(itemData.data.status === "resolved");
            }
          }
        }
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

        const messagesWithItem = data.data?.filter(
          (msg: Message) => msg.itemReference,
        );
        if (messagesWithItem && messagesWithItem.length > 0) {
          const firstItemRef = messagesWithItem[0].itemReference;
          if (firstItemRef) {
            const itemResponse = await fetch(
              `${API_ITEMS_URL}/${firstItemRef._id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (itemResponse.ok) {
              const itemData = await itemResponse.json();
              setItemReference(itemData.data);
              setIsItemResolved(itemData.data.status === "resolved");
            }
          }
        } else {
          setItemReference(null);
          setIsItemResolved(false);
        }
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setOtherUserInfo(userData.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (selectedConversation) {
      const isInConversation =
        (message.sender._id === currentUser?.id &&
          message.recipient._id === selectedConversation) ||
        (message.recipient._id === currentUser?.id &&
          message.sender._id === selectedConversation);

      if (isInConversation) {
        setMessages((prev) => [...prev, message]);

        if (message.sender._id === selectedConversation && socket) {
          socket.emit("message:read", {
            otherUserId: selectedConversation,
          });

          setConversations((prev) =>
            prev.map((conv) =>
              conv.otherUser._id === selectedConversation
                ? { ...conv, unreadCount: 0 }
                : conv,
            ),
          );
        }
      }
    }

    setTimeout(() => {
      fetchConversations();
    }, 100);
  };

  const handleTypingStart = ({ userId }: { userId: string }) => {
    setTypingUsers((prev) => new Set([...prev, userId]));
  };

  const handleTypingStop = ({ userId }: { userId: string }) => {
    setTypingUsers((prev) => {
      const updated = new Set(prev);
      updated.delete(userId);
      return updated;
    });
  };

  const handleMessageRead = ({
    conversationId,
  }: {
    conversationId: string;
  }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.conversationId === conversationId ? { ...msg, isRead: true } : msg,
      ),
    );

    fetchConversations();
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !socket) {
      return;
    }

    setSending(true);

    socket.emit("message:send", {
      recipientId: selectedConversation,
      content: messageInput.trim(),
      itemId: currentItemId || null,
    });

    setMessageInput("");
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
          setItemReference(null);
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const selectedUser =
    conversations.find((c) => c.otherUser._id === selectedConversation)
      ?.otherUser || otherUserInfo;
  const isOtherUserOnline = selectedUser && onlineUsers.has(selectedUser._id);
  const isOtherUserTyping = selectedUser && typingUsers.has(selectedUser._id);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="messages-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="messages-page">
        <div className="messages-container">
          {/* Conversations Sidebar */}
          <div className="conversations-sidebar">
            <div className="sidebar-header">
              <h2>💬 Messages</h2>
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
                      className={`conversation-item ${selectedConversation === conv.otherUser._id && currentItemId === convItemId ? "active" : ""}`}
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
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          </div>
                          {conv.itemReference && (
                            <div className="conversation-item-ref">
                              <span className="item-title">
                                {conv.itemReference.title}
                              </span>
                              {conv.itemReference.status === "resolved" && (
                                <span className="resolved-badge">
                                  ✓ Resolved
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
                        🗑️
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            {!selectedConversation ? (
              <div className="no-chat-selected">
                <div className="no-chat-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the left to start messaging</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
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
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="messages-list">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`message ${msg.sender._id === currentUser?.id ? "sent" : "received"}`}
                    >
                      {msg.sender._id !== currentUser?.id && (
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
                        {msg.itemReference && (
                          <div className="message-item-ref">
                            <img
                              src={
                                msg.itemReference.images?.[0]
                                  ? withApiBase(msg.itemReference.images[0])
                                  : "/placeholder-image.svg"
                              }
                              alt={msg.itemReference.title}
                            />
                            <div>
                              <strong>{msg.itemReference.title}</strong>
                              <span className="item-type">
                                {msg.itemReference.type === "lost"
                                  ? "Lost Item"
                                  : "Found Item"}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="message-bubble">
                          <p>{msg.content}</p>
                          <div className="message-meta">
                            <span className="message-time">
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.sender._id === currentUser?.id && (
                              <span className="message-status">
                                {msg.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {isItemResolved ? (
                  <div className="chat-closed-notice">
                    <div className="notice-icon">🔒</div>
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
                      {sending ? "⏳" : "📤"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
