"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { useSocket } from "@/contexts/SocketContext";
import { API_ENDPOINTS, withApiBase } from "@/lib/config";
import "./item.css";

interface Item {
  _id: string;
  title: string;
  description: string;
  type: "lost" | "found";
  category: string;
  subCategory?: string;
  location: {
    address: string;
    city: string;
    area: string;
    coordinates?: {
      type: string;
      coordinates: [number, number];
    };
  };
  date: string;
  images: string[];
  postedBy: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    trustScore: number;
    badges?: string[];
  };
  reward?: {
    amount: number;
    currency: string;
  };
  tags: string[];
  status: string;
  views: number;
  bookmarks: string[];
  claims: any[];
  contactPreferences: {
    email: boolean;
    phone: boolean;
    message: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetail() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;
  const { socket } = useSocket();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (itemId) {
      fetchItemDetails();
    }
  }, [itemId, router]);

  const fetchItemDetails = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_ENDPOINTS.ITEMS}/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data.data);
        setIsBookmarked(data.data.bookmarks.includes(getCurrentUserId()));
      } else {
        const errorData = await response.json().catch(() => null);
        console.error(
          "Failed to fetch item:",
          errorData?.message || response.statusText,
        );
        setItem(null); // Ensure item is null to show "Item not found" UI
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      setItem(null); // Ensure item is null to show error UI
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  const handleBookmark = async () => {
    try {
      const token = localStorage.getItem("authToken");
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
        setIsBookmarked(!isBookmarked);
      }
    } catch (error) {
      console.error("Error bookmarking:", error);
    }
  };

  const handleClaimSubmit = async () => {
    if (!claimMessage.trim()) {
      alert("Please provide a message with your claim");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_ENDPOINTS.ITEMS}/${itemId}/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: claimMessage }),
        },
      );

      if (response.ok) {
        if (socket && item) {
          socket.emit("message:send", {
            recipientId: item.postedBy._id,
            content: `I have a claim regarding your ${item.type} item: "${item.title}"\n\n${claimMessage}`,
            itemId: item._id,
          });
        }

        alert(
          "Claim submitted successfully! A message has been sent to the owner.",
        );
        setShowClaimModal(false);
        setClaimMessage("");
        fetchItemDetails();

        router.push(`/messages?to=${item?.postedBy._id}&item=${itemId}`);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to submit claim");
      }
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Error submitting claim");
    }
  };

  const handleResolveItem = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_ENDPOINTS.ITEMS}/${itemId}/resolve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        alert("Item marked as resolved!");
        setShowResolveModal(false);
        fetchItemDetails(); // Refresh the item details
      } else {
        const error = await response.json();
        alert(error.message || "Failed to resolve item");
      }
    } catch (error) {
      console.error("Error resolving item:", error);
      alert("Error resolving item");
    }
  };

  const handleDeleteItem = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_ENDPOINTS.ITEMS}/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Item deleted successfully!");
        router.push("/my-items"); // Redirect to my items page
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="item-detail-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading item details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Navigation />
        <div className="item-detail-container">
          <div className="empty-state">
            <h2>Item not found</h2>
            <button onClick={() => router.push("/explore")}>
              Back to Explore
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentImage = item.images?.[selectedImage];

  return (
    <>
      <Navigation />
      <div className="item-detail-container">
        {/* Back Button */}
        <button className="back-btn" onClick={() => router.back()}>
          ← Back
        </button>

        <div className="item-detail-content">
          {/* Left Side - Image Gallery */}
          <div className="item-gallery">
            {/* Main Image */}
            <div
              className="main-image-container"
              onClick={() => setShowImageModal(true)}
            >
              <img
                src={
                  currentImage
                    ? withApiBase(currentImage)
                    : "/placeholder-image.svg"
                }
                alt={item.title}
                className="main-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                }}
              />
              <div className="expand-icon">🔍</div>
              <div className={`type-badge ${item.type}`}>
                {item.type === "lost" ? "🔴 LOST ITEM" : "🟢 FOUND ITEM"}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {item.images.length > 1 && (
              <div className="thumbnail-gallery">
                {item.images.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? "active" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={
                        image
                          ? withApiBase(image)
                          : "/placeholder-image.svg"
                      }
                      alt={`${item.title} ${index + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-image.svg";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Image Counter */}
            <div className="image-counter">
              {selectedImage + 1} / {item.images.length}
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="item-info">
            {/* Status Badge */}
            <div className="status-badges">
              <span className={`status-badge ${item.status}`}>
                {item.status}
              </span>
              {item.reward && item.reward.amount > 0 && (
                <span className="reward-badge-large">
                  💰 Reward: {item.reward.currency} {item.reward.amount}
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="item-title">{item.title}</h1>
            <p className="item-description">{item.description}</p>

            {/* Quick Info Grid */}
            <div className="quick-info-grid">
              <div className="info-item">
                <span className="info-icon">📂</span>
                <div className="info-content">
                  <span className="info-label">Category</span>
                  <span className="info-value">{item.category}</span>
                  {item.subCategory && (
                    <span className="info-sub">{item.subCategory}</span>
                  )}
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">📍</span>
                <div className="info-content">
                  <span className="info-label">Location</span>
                  <span className="info-value">{item.location.area}</span>
                  <span className="info-sub">{item.location.city}</span>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">📅</span>
                <div className="info-content">
                  <span className="info-label">Date</span>
                  <span className="info-value">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">👁️</span>
                <div className="info-content">
                  <span className="info-label">Views</span>
                  <span className="info-value">{item.views}</span>
                </div>
              </div>
            </div>

            {/* Full Address */}
            {item.location.address && (
              <div className="full-address">
                <h3>📍 Full Address</h3>
                <p>{item.location.address}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="tags-section">
                <h3>🏷️ Tags</h3>
                <div className="tags-list">
                  {item.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Posted By */}
            <div className="posted-by-section">
              <h3>Posted By</h3>
              <div className="user-card">
                <div className="user-avatar-large">
                  {item.postedBy?.profilePicture ? (
                    <img
                      src={
                        item.postedBy.profilePicture.startsWith("http")
                          ? item.postedBy.profilePicture
                          : withApiBase(item.postedBy.profilePicture)
                      }
                      alt={item.postedBy.username || "User"}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="avatar-placeholder">
                      {item.postedBy?.username?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="user-info">
                  <h4>{item.postedBy?.username || "Unknown User"}</h4>
                  <div className="trust-score">
                    ⭐ Trust Score: {item.postedBy?.trustScore || 0}/100
                  </div>
                  {item.postedBy?.badges && item.postedBy.badges.length > 0 && (
                    <div className="badges">
                      {item.postedBy.badges.map((badge, index) => (
                        <span key={index} className="badge">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {item.postedBy?._id === getCurrentUserId() ? (
                <button
                  className={`btn-primary ${item.status === "resolved" ? "btn-resolved" : ""}`}
                  onClick={() => setShowResolveModal(true)}
                  disabled={item.status === "resolved"}
                  title={
                    item.status === "resolved"
                      ? "Item is already resolved"
                      : "Mark this item as resolved"
                  }
                >
                  <span className="btn-icon">
                    {item.status === "resolved" ? "✔️" : "✅"}
                  </span>
                  <span className="btn-text">
                    {item.status === "resolved"
                      ? "Resolved"
                      : "Mark as Resolved"}
                  </span>
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowClaimModal(true);
                  }}
                  disabled={item.status === "resolved"}
                  title={
                    item.status === "resolved"
                      ? "This item has been resolved"
                      : ""
                  }
                >
                  <span className="btn-icon">
                    {item.type === "lost" ? "🔍" : "✨"}
                  </span>
                  <span className="btn-text">
                    {item.type === "lost" ? "I Found This" : "This is Mine"}
                  </span>
                </button>
              )}
              <button
                className={`btn-secondary ${isBookmarked ? "bookmarked" : ""}`}
                onClick={handleBookmark}
                title={isBookmarked ? "Remove bookmark" : "Save for later"}
              >
                <span className="btn-icon">{isBookmarked ? "🔖" : "📌"}</span>
                <span className="btn-text">
                  {isBookmarked ? "Saved" : "Save"}
                </span>
              </button>
              {item.postedBy?._id === getCurrentUserId() ? (
                <button
                  className="btn-secondary btn-delete"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete this item"
                >
                  <span className="btn-icon">🗑️</span>
                  <span className="btn-text">Delete</span>
                </button>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() =>
                    router.push(
                      `/messages?to=${item.postedBy?._id}&item=${item._id}`,
                    )
                  }
                  title="Contact the poster"
                  disabled={!item.postedBy}
                >
                  <span className="btn-icon">💬</span>
                  <span className="btn-text">Contact</span>
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="item-stats">
              <div className="stat-item">
                <span>🔖 {item.bookmarks.length} bookmarks</span>
              </div>
              <div className="stat-item">
                <span>💬 {item.claims.length} claims</span>
              </div>
              <div className="stat-item">
                <span>Posted {formatDate(item.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Modal */}
        {showClaimModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowClaimModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {item.type === "lost"
                    ? "🔍 I Found This Item"
                    : "✨ This is My Item"}
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setShowClaimModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  {item.type === "lost"
                    ? "Please provide details about where and when you found this item, and any identifying information."
                    : "Please provide proof of ownership or identifying details that verify this item belongs to you."}
                </p>
                <div className="claim-info-box">
                  <strong>📋 What to include:</strong>
                  <ul>
                    <li>
                      {item.type === "lost"
                        ? "Where you found it"
                        : "Serial numbers or receipts"}
                    </li>
                    <li>
                      {item.type === "lost"
                        ? "When you found it"
                        : "Unique identifying features"}
                    </li>
                    <li>
                      {item.type === "lost"
                        ? "Current condition"
                        : "Purchase date and location"}
                    </li>
                    <li>Any additional proof or photos</li>
                  </ul>
                </div>
                <textarea
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                  placeholder={
                    item.type === "lost"
                      ? "I found this item on [date] at [location]. The item is in [condition] and has [identifying features]..."
                      : "This is my item. I can verify ownership with [specific details]. It has [unique features]..."
                  }
                  rows={6}
                  className={
                    claimMessage.trim().length > 0 ? "has-content" : ""
                  }
                />
                <div className="char-count">
                  {claimMessage.length} characters
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowClaimModal(false);
                    setClaimMessage("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleClaimSubmit}
                  disabled={!claimMessage.trim()}
                >
                  Submit Claim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {showResolveModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowResolveModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✅ Mark as Resolved</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowResolveModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Are you sure you want to mark this item as resolved? This
                  will:
                </p>
                <div className="claim-info-box">
                  <ul>
                    <li>Change the item status to "Resolved"</li>
                    <li>Disable further claims on this item</li>
                    <li>Stop chat conversations related to this item</li>
                    <li>Mark the item as successfully reunited</li>
                  </ul>
                </div>
                <p style={{ marginTop: "1rem", fontWeight: 700 }}>
                  This action cannot be undone easily.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleResolveItem}
                  style={{ background: "var(--green)" }}
                >
                  Confirm Resolve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowDeleteModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🗑️ Delete Item</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Are you sure you want to delete this item? This will:
                </p>
                <div className="claim-info-box">
                  <ul>
                    <li>Permanently remove the item from the system</li>
                    <li>Delete all associated images and data</li>
                    <li>Remove all claims and bookmarks</li>
                    <li>Cannot be undone</li>
                  </ul>
                </div>
                <p
                  style={{
                    marginTop: "1rem",
                    fontWeight: 700,
                    color: "var(--red)",
                  }}
                >
                  This action is permanent and cannot be reversed!
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleDeleteItem}
                  style={{ background: "var(--red)" }}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal (Full Screen) */}
        {showImageModal && (
          <div
            className="image-modal-overlay"
            onClick={() => setShowImageModal(false)}
          >
            <button className="modal-close-btn">✕</button>
            <button
              className="modal-nav-btn prev"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) =>
                  prev > 0 ? prev - 1 : item.images.length - 1,
                );
              }}
            >
              ‹
            </button>
            <img
              src={
                currentImage
                  ? withApiBase(currentImage)
                  : "/placeholder-image.svg"
              }
              alt={item.title}
              className="modal-image"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="modal-nav-btn next"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) =>
                  prev < item.images.length - 1 ? prev + 1 : 0,
                );
              }}
            >
              ›
            </button>
            <div className="modal-image-counter">
              {selectedImage + 1} / {item.images.length}
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowContactModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💬 Contact {item.postedBy.username}</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowContactModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="contact-intro">
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
                    <div>
                      <strong>{item.postedBy.username}</strong>
                      <div className="mini-trust-score">
                        ⭐ {item.postedBy.trustScore}/100
                      </div>
                    </div>
                  </div>
                </div>
                <div className="contact-options">
                  {item.contactPreferences.email && (
                    <div className="contact-option">
                      <span className="contact-icon">📧</span>
                      <div className="contact-details">
                        <strong>Email</strong>
                        <p>{item.postedBy.email}</p>
                        <a
                          href={`mailto:${item.postedBy.email}?subject=Regarding ${item.type} item: ${item.title}`}
                          className="btn-contact-action"
                        >
                          Send Email
                        </a>
                      </div>
                    </div>
                  )}
                  {item.contactPreferences.message && (
                    <div className="contact-option">
                      <span className="contact-icon">💬</span>
                      <div className="contact-details">
                        <strong>In-App Message</strong>
                        <p>Send a secure message through the platform</p>
                        <button
                          className="btn-contact-action"
                          onClick={() => {
                            router.push(
                              `/messages?to=${item.postedBy._id}&item=${itemId}`,
                            );
                          }}
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  )}
                  {!item.contactPreferences.email &&
                    !item.contactPreferences.message && (
                      <div className="no-contact-info">
                        <p>
                          ⚠️ The poster hasn't enabled any contact methods yet.
                        </p>
                        <p>Try bookmarking this item and check back later.</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
