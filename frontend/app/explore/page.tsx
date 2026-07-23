"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { API_ENDPOINTS, withApiBase } from "@/lib/config";
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

  const hasActiveFilters =
    filterType !== "all" ||
    filterCategory !== "All Categories" ||
    filterCity !== "All Cities" ||
    filterStatus !== "all";

  return (
    <main className="page explore-page">
      <div className="page-wide">
        <button
          type="button"
          className="btn btn-ghost btn-sm explore-back"
          onClick={() => router.back()}
        >
          Back
        </button>

        <header className="explore-hero">
          <span className="eyebrow">Browse reports</span>
          <div className="explore-hero-row">
            <div>
              <h1 className="display">Explore lost and found items</h1>
              <p className="section-sub">
                Search recent community reports, narrow by location, and open a
                listing when something looks familiar.
              </p>
            </div>
            <div className="explore-count surface" aria-live="polite">
              <strong>{filteredItems.length}</strong>
              <span>{filteredItems.length === 1 ? "item" : "items"} found</span>
            </div>
          </div>
        </header>

        <section className="surface explore-toolbar" aria-label="Search items">
          <label className="field explore-search">
            <span className="sr-only">Search items</span>
            <input
              type="text"
              placeholder="Search by item, category, or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          {searchTerm && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            Filters
            {hasActiveFilters && <span className="filter-dot" aria-hidden />}
          </button>
        </section>

        {showFilters && (
          <section className="surface filters-panel" aria-label="Filter items">
            <div className="filters-grid">
              <label className="field">
                <span>Type</span>
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
              </label>

              <label className="field">
                <span>Category</span>
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
              </label>

              <label className="field">
                <span>City</span>
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
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </label>

              <label className="field">
                <span>Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="views">Most Viewed</option>
                  <option value="reward">Highest Reward</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          </section>
        )}

        <section className="explore-results" aria-label="Item results">
          <div className="results-header">
            <p className="muted">
              Showing {filteredItems.length} of {items.length} reports
            </p>
            <div className="quick-filters" aria-label="Quick type filters">
              <button
                type="button"
                className={`btn btn-sm ${filterType === "all" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilterType("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterType === "lost" ? "btn-lost" : "btn-secondary"}`}
                onClick={() => setFilterType("lost")}
              >
                Lost
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterType === "found" ? "btn-found" : "btn-secondary"}`}
                onClick={() => setFilterType("found")}
              >
                Found
              </button>
            </div>
          </div>

          {loading ? (
            <div className="surface loading-state" role="status">
              <div className="spinner" aria-hidden />
              <p>Loading items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <h3>No items found</h3>
              <p>Try adjusting your search or filters.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="item-grid">
              {filteredItems.map((item) => (
                <article
                  key={item._id}
                  className="item-card explore-card"
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
                    <div className="explore-card-badges">
                      <span
                        className={`badge ${item.type === "lost" ? "badge-lost" : "badge-found"}`}
                      >
                        {item.type === "lost" ? "Lost" : "Found"}
                      </span>
                      {item.reward && item.reward > 0 && (
                        <span className="badge badge-neutral">
                          Reward Rs. {item.reward}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="item-card-body">
                    <div className="explore-card-heading">
                      <h2 className="item-card-title">{item.title}</h2>
                      <span
                        className={`badge ${item.status === "active" ? "badge-active" : "badge-resolved"}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="explore-card-description">
                      {item.description}
                    </p>

                    <dl className="item-card-meta explore-card-meta">
                      <div>
                        <dt>Category</dt>
                        <dd>{item.category}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>
                          {item.location.area}, {item.location.city}
                        </dd>
                      </div>
                    </dl>

                    <footer className="explore-card-footer">
                      <div className="poster-summary">
                        <div className="poster-avatar" aria-hidden>
                          {item.postedBy?.profilePicture ? (
                            <img
                              src={
                                item.postedBy.profilePicture.startsWith("http")
                                  ? item.postedBy.profilePicture
                                  : withApiBase(item.postedBy.profilePicture)
                              }
                              alt=""
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
                        <span>{item.postedBy?.username || "Unknown User"}</span>
                      </div>
                      <div className="explore-card-stats">
                        <span>{item.views} views</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </footer>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
