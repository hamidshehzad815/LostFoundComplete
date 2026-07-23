"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthToken } from "@/lib/auth";
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
      <main className="page">
        <div className="saved-loading">
          <div className="spinner" />
          <p className="muted">Loading your saved items...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-wide saved-shell">
        <button className="btn btn-ghost btn-sm saved-back" onClick={() => router.back()}>
          Back
        </button>

        <section className="saved-header surface">
          <div>
            <span className="eyebrow">Saved</span>
            <h1 className="display">Saved Items</h1>
            <p className="muted">Items you have bookmarked for later review.</p>
          </div>
          <span className="badge badge-neutral">{items.length} saved</span>
        </section>

        <section className="saved-filters surface" aria-label="Saved item filters">
          <div className="filter-group">
            <span className="filter-label">Type</span>
            <div className="filter-buttons">
              <button
                className={`btn btn-sm saved-filter-button ${
                  filter === "all" ? "active" : ""
                }`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`btn btn-sm saved-filter-button ${
                  filter === "lost" ? "active" : ""
                }`}
                onClick={() => setFilter("lost")}
              >
                Lost
              </button>
              <button
                className={`btn btn-sm saved-filter-button ${
                  filter === "found" ? "active" : ""
                }`}
                onClick={() => setFilter("found")}
              >
                Found
              </button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Status</span>
            <div className="filter-buttons">
              <button
                className={`btn btn-sm saved-filter-button ${
                  statusFilter === "all" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                className={`btn btn-sm saved-filter-button ${
                  statusFilter === "active" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("active")}
              >
                Active
              </button>
              <button
                className={`btn btn-sm saved-filter-button ${
                  statusFilter === "resolved" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("resolved")}
              >
                Resolved
              </button>
            </div>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="empty-state">
            <h2>No saved items yet</h2>
            <p>
              Start exploring and bookmark items you want to revisit.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/explore")}
            >
              Explore Items
            </button>
          </div>
        ) : (
          <section>
            <div className="saved-count muted">
              Showing {items.length} saved {items.length === 1 ? "item" : "items"}
            </div>
            <div className="item-grid">
            {items.map((item) => (
              <article key={item._id} className="item-card">
                <div
                  className="item-card-image"
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
                  <div
                    className={`badge ${
                      item.type === "lost" ? "badge-lost" : "badge-found"
                    } saved-type-badge`}
                  >
                    {item.type === "lost" ? "Lost" : "Found"}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm saved-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBookmark(item._id);
                    }}
                    title="Remove bookmark"
                  >
                    Remove
                  </button>
                </div>

                <div
                  className="item-card-body"
                  onClick={() => handleCardClick(item._id)}
                >
                  <h3 className="item-card-title">{item.title}</h3>
                  <p className="item-description">
                    {item.description.length > 100
                      ? `${item.description.substring(0, 100)}...`
                      : item.description}
                  </p>

                  <div className="item-meta">
                    <span>{item.category}</span>
                    <span className="location">
                      {item.location.area}, {item.location.city}
                    </span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  {item.reward && item.reward.amount > 0 && (
                    <div className="reward-badge">
                      Reward: {item.reward.currency} {item.reward.amount}
                    </div>
                  )}

                  <div className="item-footer">
                    <div className="saved-poster">
                      {item.postedBy.profilePicture ? (
                        <img
                          src={
                            item.postedBy.profilePicture.startsWith("http")
                              ? item.postedBy.profilePicture
                              : withApiBase(item.postedBy.profilePicture)
                          }
                          alt={item.postedBy.username}
                          className="saved-poster-avatar"
                        />
                      ) : (
                        <div className="saved-poster-avatar">
                          {item.postedBy.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{item.postedBy.username}</span>
                    </div>
                    <span
                      className={`badge ${
                        item.status === "active"
                          ? "badge-active"
                          : item.status === "resolved"
                            ? "badge-resolved"
                            : "badge-neutral"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </article>
            ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
