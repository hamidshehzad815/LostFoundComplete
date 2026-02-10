"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthToken } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { API_ENDPOINTS, withApiBase } from "@/lib/config";
import "./saved.css";

interface Item {
  _id: string;
  title: string;
  description: string;
  type: "lost" | "found";
  category: string;
  location: {
    city: string;
    area: string;
    address: string;
  };
  images: string[];
  postedBy: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
  status: string;
  reward?: {
    amount: number;
    currency: string;
  };
  views: number;
  bookmarks: string[];
}

export default function SavedItems() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchBookmarkedItems();
  }, [filter, statusFilter]);

  const fetchBookmarkedItems = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      let url = `${API_ENDPOINTS.ITEMS}/user/bookmarks?`;
      if (filter !== "all") url += `type=${filter}&`;
      if (statusFilter !== "all") url += `status=${statusFilter}&`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      } else if (response.status === 401) {
        router.push("/login?error=session_expired");
      }
    } catch (error) {
      console.error("Error fetching bookmarked items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (itemId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_ENDPOINTS.ITEMS}/${itemId}/bookmark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setItems(items.filter((item) => item._id !== itemId));
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const handleCardClick = (itemId: string) => {
    router.push(`/item/${itemId}`);
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const itemDate = new Date(date);
    const diffInMs = now.getTime() - itemDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return itemDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="saved-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your saved items...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="saved-container">
        <button className="back-btn" onClick={() => router.back()}>
          ← Back
        </button>

        {/* Header */}
        <div className="saved-header">
          <div className="header-content">
            <h1>🔖 Saved Items</h1>
            <p>Items you've bookmarked for later</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Type:</label>
            <div className="filter-buttons">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={filter === "lost" ? "active" : ""}
                onClick={() => setFilter("lost")}
              >
                Lost
              </button>
              <button
                className={filter === "found" ? "active" : ""}
                onClick={() => setFilter("found")}
              >
                Found
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <div className="filter-buttons">
              <button
                className={statusFilter === "all" ? "active" : ""}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                className={statusFilter === "active" ? "active" : ""}
                onClick={() => setStatusFilter("active")}
              >
                Active
              </button>
              <button
                className={statusFilter === "resolved" ? "active" : ""}
                onClick={() => setStatusFilter("resolved")}
              >
                Resolved
              </button>
            </div>
          </div>
        </div>

        {/* Items Count */}
        <div className="items-count">
          <span>{items.length} saved items</span>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔖</div>
            <h2>No saved items yet</h2>
            <p>
              Start exploring and bookmark items you're interested in to see
              them here!
            </p>
            <button
              className="btn-explore"
              onClick={() => router.push("/explore")}
            >
              Explore Items
            </button>
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item._id} className="item-card">
                <div
                  className="item-image"
                  onClick={() => handleCardClick(item._id)}
                >
                  <img
                    src={
                      item.images[0]
                        ? withApiBase(item.images[0])
                        : "/placeholder-image.svg"
                    }
                    alt={item.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-image.svg";
                    }}
                  />
                  <div className={`type-badge ${item.type}`}>
                    {item.type === "lost" ? "🔴 LOST" : "🟢 FOUND"}
                  </div>
                  <button
                    className="remove-bookmark-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBookmark(item._id);
                    }}
                    title="Remove bookmark"
                  >
                    ❌
                  </button>
                </div>

                <div
                  className="item-details"
                  onClick={() => handleCardClick(item._id)}
                >
                  <h3>{item.title}</h3>
                  <p className="item-description">
                    {item.description.length > 100
                      ? `${item.description.substring(0, 100)}...`
                      : item.description}
                  </p>

                  <div className="item-meta">
                    <span className="category">📂 {item.category}</span>
                    <span className="location">
                      📍 {item.location.area}, {item.location.city}
                    </span>
                    <span className="date">
                      🕒 {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.reward && item.reward.amount > 0 && (
                    <div className="reward-badge">
                      💰 Reward: {item.reward.currency} {item.reward.amount}
                    </div>
                  )}

                  <div className="item-footer">
                    <div className="poster-info">
                      {item.postedBy.profilePicture ? (
                        <img
                          src={
                            item.postedBy.profilePicture.startsWith("http")
                              ? item.postedBy.profilePicture
                              : withApiBase(item.postedBy.profilePicture)
                          }
                          alt={item.postedBy.username}
                          className="poster-avatar"
                        />
                      ) : (
                        <div className="poster-avatar-placeholder">
                          {item.postedBy.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{item.postedBy.username}</span>
                    </div>
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
