"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getAuthToken } from "@/lib/auth";
import { API_ENDPOINTS, withApiBase } from "@/lib/config";
import "./my-items.css";

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
  reward?: number;
  views: number;
  bookmarks: string[];
}

const CATEGORIES = [
  "All Categories",
  "Mobile Phones",
  "Laptops",
  "Tablets",
  "Cameras",
  "Headphones",
  "Smart Watches",
  "Gaming Devices",
  "ID Cards",
  "Passports",
  "Licenses",
  "Certificates",
  "Bank Cards",
  "Rings",
  "Necklaces",
  "Bracelets",
  "Earrings",
  "Watches",
  "Dogs",
  "Cats",
  "Birds",
  "Bags & Luggage",
  "Keys",
  "Clothing",
  "Accessories",
  "Glasses",
  "Umbrellas",
  "Books",
  "Sports Equipment",
  "Toys",
  "Musical Instruments",
  "Tools",
  "Medical Equipment",
  "Bicycles",
  "Motorcycles",
  "Other",
];

export default function MyItems() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchMyItems();
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [items, searchTerm, filterType, filterCategory, filterStatus, sortBy]);

  const fetchMyItems = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_ENDPOINTS.ITEMS}/user/my-items`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching my items:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    if (filterCategory !== "All Categories") {
      filtered = filtered.filter((item) => item.category === filterCategory);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "views":
          return b.views - a.views;
        case "reward":
          return (b.reward || 0) - (a.reward || 0);
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("All Categories");
    setFilterStatus("all");
    setSortBy("recent");
  };

  const handleCardClick = (itemId: string) => {
    router.push(`/item/${itemId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setSelectedItem(itemId);
    setShowDeleteModal(true);
  };

  const handleResolveClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setSelectedItem(itemId);
    setShowResolveModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_ENDPOINTS.ITEMS}/${selectedItem}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setItems(items.filter((item) => item._id !== selectedItem));
        setShowDeleteModal(false);
        setSelectedItem(null);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmResolve = async () => {
    if (!selectedItem) return;

    setActionLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_ENDPOINTS.ITEMS}/${selectedItem}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setItems(
          items.map((item) =>
            item._id === selectedItem ? { ...item, status: "resolved" } : item,
          ),
        );
        setShowResolveModal(false);
        setSelectedItem(null);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to resolve item");
      }
    } catch (error) {
      console.error("Error resolving item:", error);
      alert("Error resolving item");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const itemDate = new Date(date);
    const diffInMs = now.getTime() - itemDate.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return itemDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <main className="page">
        <div className="my-items-loading">
          <div className="spinner" />
          <p className="muted">Loading your items...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-wide my-items-shell">
        <button className="btn btn-ghost btn-sm my-items-back" onClick={() => router.back()}>
          Back
        </button>

        <section className="my-items-header surface">
          <div>
            <span className="eyebrow">Manage</span>
            <h1 className="display">My Items</h1>
            <p className="muted">Manage your posted lost and found items.</p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push("/post")}>
            Post an Item
          </button>
        </section>

        <section className="search-section surface">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search your items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </button>
            )}
          </div>
          <button
            className="btn btn-secondary filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {(filterType !== "all" ||
              filterCategory !== "All Categories" ||
              filterStatus !== "all") && (
              <span className="filter-badge">Active</span>
            )}
          </button>
        </section>

        {showFilters && (
          <section className="filters-section surface">
            <div className="filters-grid">
              <div className="field">
                <label>Type</label>
                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as "all" | "lost" | "found")
                  }
                >
                  <option value="all">All Types</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>

              <div className="field">
                <label>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="field">
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Recent First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="views">Most Views</option>
                  <option value="reward">Highest Reward</option>
                </select>
              </div>
            </div>

            <button className="btn btn-secondary btn-sm clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </section>
        )}

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <h2>No Items Found</h2>
            <p>
              {items.length === 0
                ? "You have not posted any items yet"
                : "No items match your current filters"}
            </p>
            {items.length === 0 ? (
              <button
                className="btn btn-primary"
                onClick={() => router.push("/post")}
              >
                Post Your First Item
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <section className="item-grid">
            {filteredItems.map((item) => (
              <article
                key={item._id}
                className={`item-card ${item.type}`}
                onClick={() => handleCardClick(item._id)}
              >
                <div className="item-card-image">
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
                    } my-item-type`}
                  >
                    {item.type === "lost" ? "Lost" : "Found"}
                  </div>
                  {item.reward && item.reward > 0 && (
                    <div className="reward-badge">Reward Rs. {item.reward}</div>
                  )}
                </div>

                <div className="item-card-body">
                  <div className="my-item-title-row">
                    <h3 className="item-card-title">{item.title}</h3>
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
                  <p className="card-description">{item.description}</p>

                  <div className="card-meta">
                    <div className="meta-item">
                      <span>{item.category}</span>
                    </div>
                    <div className="meta-item">
                      <span>
                        {item.location.area}, {item.location.city}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="poster-info">
                      <div className="poster-avatar">
                        {item.postedBy?.profilePicture ? (
                          <img
                              src={
                                item.postedBy.profilePicture.startsWith("http")
                                  ? item.postedBy.profilePicture
                                  : withApiBase(item.postedBy.profilePicture)
                              }
                            alt={item.postedBy.username || "User"}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <span>
                            {item.postedBy?.username
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <span className="poster-name">
                        {item.postedBy?.username || "Unknown User"}
                      </span>
                    </div>
                    <div className="card-stats">
                      <span className="stat">{item.views} views</span>
                      <span className="stat time">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="item-actions">
                    {item.status !== "resolved" && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleResolveClick(e, item._id)}
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => handleDeleteClick(e, item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {showDeleteModal && (
        <div
          className="modal-backdrop"
          onClick={() => !actionLoading && setShowDeleteModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-modal-header">
              <h3>Delete Item</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
              >
                Close
              </button>
            </div>
            <p>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div
          className="modal-backdrop"
          onClick={() => !actionLoading && setShowResolveModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-modal-header">
              <h3>Mark as Resolved</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowResolveModal(false)}
                disabled={actionLoading}
              >
                Close
              </button>
            </div>
            <p>
              Mark this item as resolved? This will close all related chats and
              users will not be able to send new messages about this item.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowResolveModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmResolve}
                disabled={actionLoading}
              >
                {actionLoading ? "Resolving..." : "Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
