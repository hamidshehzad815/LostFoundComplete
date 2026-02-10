"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { API_ENDPOINTS, withApiBase } from "@/lib/config";
import Navigation from "@/components/Navigation";
import "./explore.css";

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

const CITIES = [
  "All Cities",
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
];

export default function Explore() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterCity, setFilterCity] = useState("All Cities");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchItems();
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [
    items,
    searchTerm,
    filterType,
    filterCategory,
    filterCity,
    filterStatus,
    sortBy,
  ]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(API_ENDPOINTS.ITEMS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
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

    if (filterCity !== "All Cities") {
      filtered = filtered.filter((item) => item.location.city === filterCity);
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
    setFilterCity("All Cities");
    setFilterStatus("all");
    setSortBy("recent");
  };

  const handleCardClick = (itemId: string) => {
    router.push(`/item/${itemId}`);
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

  return (
    <>
      <Navigation />
      <div className="explore-container">
        {/* Back Button */}
        <button className="back-btn" onClick={() => router.back()}>
          ← Back
        </button>

        {/* Header */}
        <div className="explore-header">
          <div className="header-content">
            <h1>🔍 Explore Lost & Found Items</h1>
            <p>Discover items that have been lost or found in your area</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔎</span>
            <input
              type="text"
              placeholder="Search items, categories, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            🎛️ Filters
            {(filterType !== "all" ||
              filterCategory !== "All Categories" ||
              filterCity !== "All Cities" ||
              filterStatus !== "all") && (
              <span className="filter-badge">•</span>
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-section">
            <div className="filters-grid">
              {/* Type Filter */}
              <div className="filter-group">
                <label>Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="all">All Types</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="filter-group">
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

              {/* City Filter */}
              <div className="filter-group">
                <label>City</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="filter-group">
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="views">Most Viewed</option>
                  <option value="reward">Highest Reward</option>
                </select>
              </div>
            </div>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        )}

        {/* Results Info */}
        <div className="results-info">
          <p>
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"} found
          </p>
          <div className="quick-filters">
            <button
              className={`quick-filter ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All
            </button>
            <button
              className={`quick-filter ${filterType === "lost" ? "active" : ""}`}
              onClick={() => setFilterType("lost")}
            >
              🔴 Lost
            </button>
            <button
              className={`quick-filter ${filterType === "found" ? "active" : ""}`}
              onClick={() => setFilterType("found")}
            >
              🟢 Found
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No items found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button onClick={clearFilters} className="clear-btn">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`item-card ${item.type}`}
                onClick={() => handleCardClick(item._id)}
              >
                {/* Image */}
                <div className="card-image">
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
                  <div className={`card-type-badge ${item.type}`}>
                    {item.type === "lost" ? "🔴 Lost" : "🟢 Found"}
                  </div>
                  {item.reward && item.reward > 0 && (
                    <div className="reward-badge">💰 Rs. {item.reward}</div>
                  )}
                </div>

                {/* Content */}
                <div className="card-content">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-description">{item.description}</p>

                  <div className="card-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📂</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>
                        {item.location.area}, {item.location.city}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
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
                          <span>👤</span>
                        )}
                      </div>
                      <span className="poster-name">
                        {item.postedBy?.username || "Unknown User"}
                      </span>
                    </div>
                    <div className="card-stats">
                      <span className="stat">👁️ {item.views}</span>
                      <span className="stat time">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
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
