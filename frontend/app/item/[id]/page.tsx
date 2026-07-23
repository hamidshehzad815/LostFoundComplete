"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import { isAuthenticated } from "@/lib/auth";
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
  claims: unknown[];
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
        setItem(null);
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      setItem(null);
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
        fetchItemDetails();
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
        router.push("/my-items");
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
      <main className="page item-detail-page">
        <div className="page-wide">
          <div className="surface item-loading" role="status">
            <div className="spinner" aria-hidden />
            <p>Loading item details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="page item-detail-page">
        <div className="page-wide">
          <div className="empty-state">
            <h3>Item not found</h3>
            <p>This report may have been removed or is no longer available.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => router.push("/explore")}
            >
              Back to explore
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentImage = item.images?.[selectedImage];
  const imageCount = item.images?.length || 0;
  const currentUserId = getCurrentUserId();
  const isOwner = item.postedBy?._id === currentUserId;

  return (
    <main className="page item-detail-page">
      <div className="page-wide">
        <button
          type="button"
          className="btn btn-ghost btn-sm item-back"
          onClick={() => router.back()}
        >
          Back
        </button>

        <div className="item-detail-layout">
          <section className="item-gallery" aria-label="Item photos">
            <button
              type="button"
              className="main-image-container"
              onClick={() => setShowImageModal(true)}
            >
              <img
                src={
                  currentImage ? withApiBase(currentImage) : "/placeholder-image.svg"
                }
                alt={item.title}
                className="main-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                }}
              />
              <span
                className={`badge image-type-badge ${item.type === "lost" ? "badge-lost" : "badge-found"}`}
              >
                {item.type === "lost" ? "Lost item" : "Found item"}
              </span>
              <span className="image-action">Open image</span>
            </button>

            {imageCount > 1 && (
              <div className="thumbnail-gallery" aria-label="Photo thumbnails">
                {item.images.map((image, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`thumbnail ${selectedImage === index ? "active" : ""}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img
                      src={image ? withApiBase(image) : "/placeholder-image.svg"}
                      alt={`${item.title} ${index + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-image.svg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            <p className="image-counter">
              {imageCount > 0
                ? `${selectedImage + 1} of ${imageCount} images`
                : "No images uploaded"}
            </p>
          </section>

          <section className="surface item-info" aria-labelledby="item-title">
            <div className="status-badges">
              <span
                className={`badge ${item.status === "active" ? "badge-active" : "badge-resolved"}`}
              >
                {item.status}
              </span>
              {item.reward && item.reward.amount > 0 && (
                <span className="badge badge-neutral">
                  Reward {item.reward.currency} {item.reward.amount}
                </span>
              )}
            </div>

            <header className="item-heading">
              <span className="eyebrow">{item.category}</span>
              <h1 id="item-title" className="display item-title">
                {item.title}
              </h1>
              <p>{item.description}</p>
            </header>

            <dl className="quick-info-grid">
              <div className="info-item">
                <dt>Category</dt>
                <dd>{item.category}</dd>
                {item.subCategory && <span>{item.subCategory}</span>}
              </div>
              <div className="info-item">
                <dt>Location</dt>
                <dd>{item.location.area || "Area not specified"}</dd>
                <span>{item.location.city}</span>
              </div>
              <div className="info-item">
                <dt>Date</dt>
                <dd>{new Date(item.date).toLocaleDateString()}</dd>
              </div>
              <div className="info-item">
                <dt>Views</dt>
                <dd>{item.views}</dd>
              </div>
            </dl>

            {item.location.address && (
              <section className="detail-panel">
                <h2>Full address</h2>
                <p>{item.location.address}</p>
              </section>
            )}

            {item.tags && item.tags.length > 0 && (
              <section className="detail-panel">
                <h2>Tags</h2>
                <div className="tags-list">
                  {item.tags.map((tag, index) => (
                    <span key={index} className="badge badge-neutral">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="posted-by-section">
              <h2>Posted by</h2>
              <div className="user-card">
                <div className="user-avatar-large" aria-hidden>
                  {item.postedBy?.profilePicture ? (
                    <img
                      src={
                        item.postedBy.profilePicture.startsWith("http")
                          ? item.postedBy.profilePicture
                          : withApiBase(item.postedBy.profilePicture)
                      }
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span>
                      {item.postedBy?.username?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="user-info">
                  <h3>{item.postedBy?.username || "Unknown User"}</h3>
                  <p>Trust score {item.postedBy?.trustScore || 0}/100</p>
                  {item.postedBy?.badges && item.postedBy.badges.length > 0 && (
                    <div className="badges">
                      {item.postedBy.badges.map((badge, index) => (
                        <span key={index} className="badge badge-neutral">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="action-buttons" aria-label="Item actions">
              {isOwner ? (
                <button
                  type="button"
                  className={`btn btn-primary ${item.status === "resolved" ? "btn-resolved" : ""}`}
                  onClick={() => setShowResolveModal(true)}
                  disabled={item.status === "resolved"}
                  title={
                    item.status === "resolved"
                      ? "Item is already resolved"
                      : "Mark this item as resolved"
                  }
                >
                  {item.status === "resolved" ? "Resolved" : "Mark as resolved"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
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
                  {item.type === "lost" ? "I found this" : "This is mine"}
                </button>
              )}
              <button
                type="button"
                className={`btn btn-secondary ${isBookmarked ? "bookmarked" : ""}`}
                onClick={handleBookmark}
                title={isBookmarked ? "Remove bookmark" : "Save for later"}
              >
                {isBookmarked ? "Saved" : "Save"}
              </button>
              {isOwner ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-delete"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete this item"
                >
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    router.push(
                      `/messages?to=${item.postedBy?._id}&item=${item._id}`,
                    )
                  }
                  title="Contact the poster"
                  disabled={!item.postedBy}
                >
                  Contact
                </button>
              )}
            </div>

            <dl className="item-stats">
              <div>
                <dt>Bookmarks</dt>
                <dd>{item.bookmarks.length}</dd>
              </div>
              <div>
                <dt>Claims</dt>
                <dd>{item.claims.length}</dd>
              </div>
              <div>
                <dt>Posted</dt>
                <dd>{formatDate(item.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </div>

        {showClaimModal && (
          <div
            className="modal-backdrop item-modal-backdrop"
            onClick={() => setShowClaimModal(false)}
          >
            <section
              className="modal item-dialog"
              onClick={(e) => e.stopPropagation()}
              aria-modal="true"
              role="dialog"
              aria-labelledby="claim-title"
            >
              <div className="item-modal-header">
                <h2 id="claim-title">
                  {item.type === "lost" ? "I found this item" : "This is my item"}
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowClaimModal(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  {item.type === "lost"
                    ? "Share where and when you found it, plus any identifying details."
                    : "Share ownership details that can help the poster verify your claim."}
                </p>
                <div className="claim-info-box">
                  <strong>What to include</strong>
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
                <label className="field">
                  <span>Claim message</span>
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
                </label>
                <div className="char-count">
                  {claimMessage.length} characters
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowClaimModal(false);
                    setClaimMessage("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleClaimSubmit}
                  disabled={!claimMessage.trim()}
                >
                  Submit claim
                </button>
              </div>
            </section>
          </div>
        )}

        {showResolveModal && (
          <div
            className="modal-backdrop item-modal-backdrop"
            onClick={() => setShowResolveModal(false)}
          >
            <section
              className="modal item-dialog"
              onClick={(e) => e.stopPropagation()}
              aria-modal="true"
              role="dialog"
              aria-labelledby="resolve-title"
            >
              <div className="item-modal-header">
                <h2 id="resolve-title">Mark as resolved</h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowResolveModal(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Are you sure you want to mark this item as resolved? This
                  will:
                </p>
                <div className="claim-info-box">
                  <ul>
                    <li>Change the item status to resolved</li>
                    <li>Disable further claims on this item</li>
                    <li>Stop chat conversations related to this item</li>
                    <li>Mark the item as successfully reunited</li>
                  </ul>
                </div>
                <p className="modal-warning">This action cannot be undone easily.</p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-found"
                  onClick={handleResolveItem}
                >
                  Confirm resolve
                </button>
              </div>
            </section>
          </div>
        )}

        {showDeleteModal && (
          <div
            className="modal-backdrop item-modal-backdrop"
            onClick={() => setShowDeleteModal(false)}
          >
            <section
              className="modal item-dialog"
              onClick={(e) => e.stopPropagation()}
              aria-modal="true"
              role="dialog"
              aria-labelledby="delete-title"
            >
              <div className="item-modal-header">
                <h2 id="delete-title">Delete item</h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Close
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
                <p className="modal-danger">
                  This action is permanent and cannot be reversed.
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteItem}
                >
                  Delete permanently
                </button>
              </div>
            </section>
          </div>
        )}

        {showImageModal && (
          <div
            className="image-modal-overlay"
            onClick={() => setShowImageModal(false)}
          >
            <button
              type="button"
              className="image-modal-close btn btn-secondary btn-sm"
              onClick={() => setShowImageModal(false)}
            >
              Close
            </button>
            {imageCount > 1 && (
              <button
                type="button"
                className="image-modal-nav prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) =>
                    prev > 0 ? prev - 1 : imageCount - 1,
                  );
                }}
              >
                Previous
              </button>
            )}
            <img
              src={
                currentImage ? withApiBase(currentImage) : "/placeholder-image.svg"
              }
              alt={item.title}
              className="modal-image"
              onClick={(e) => e.stopPropagation()}
            />
            {imageCount > 1 && (
              <button
                type="button"
                className="image-modal-nav next"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) =>
                    prev < imageCount - 1 ? prev + 1 : 0,
                  );
                }}
              >
                Next
              </button>
            )}
            <div className="modal-image-counter">
              {imageCount > 0 ? `${selectedImage + 1} / ${imageCount}` : "0 / 0"}
            </div>
          </div>
        )}

        {showContactModal && (
          <div
            className="modal-backdrop item-modal-backdrop"
            onClick={() => setShowContactModal(false)}
          >
            <section
              className="modal item-dialog"
              onClick={(e) => e.stopPropagation()}
              aria-modal="true"
              role="dialog"
              aria-labelledby="contact-title"
            >
              <div className="item-modal-header">
                <h2 id="contact-title">Contact {item.postedBy.username}</h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowContactModal(false)}
                >
                  Close
                </button>
              </div>
              <div className="modal-body">
                <div className="contact-intro">
                  <div className="contact-poster">
                    {item.postedBy.profilePicture ? (
                      <img
                        src={
                          item.postedBy.profilePicture.startsWith("http")
                            ? item.postedBy.profilePicture
                            : withApiBase(item.postedBy.profilePicture)
                        }
                        alt={item.postedBy.username}
                      />
                    ) : (
                      <div className="contact-avatar-placeholder">
                        {item.postedBy.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong>{item.postedBy.username}</strong>
                      <p>Trust score {item.postedBy.trustScore}/100</p>
                    </div>
                  </div>
                </div>
                <div className="contact-options">
                  {item.contactPreferences.email && (
                    <div className="contact-option">
                      <div>
                        <strong>Email</strong>
                        <p>{item.postedBy.email}</p>
                        <a
                          href={`mailto:${item.postedBy.email}?subject=Regarding ${item.type} item: ${item.title}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Send email
                        </a>
                      </div>
                    </div>
                  )}
                  {item.contactPreferences.message && (
                    <div className="contact-option">
                      <div>
                        <strong>In-app message</strong>
                        <p>Send a secure message through the platform.</p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            router.push(
                              `/messages?to=${item.postedBy._id}&item=${itemId}`,
                            );
                          }}
                        >
                          Send message
                        </button>
                      </div>
                    </div>
                  )}
                  {!item.contactPreferences.email &&
                    !item.contactPreferences.message && (
                      <div className="no-contact-info">
                        <p>The poster has not enabled contact methods yet.</p>
                        <p>Try bookmarking this item and check back later.</p>
                      </div>
                    )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
