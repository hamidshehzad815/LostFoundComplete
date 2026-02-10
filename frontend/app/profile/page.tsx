"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./profile.css";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profilePicture: string;
  preferredLanguage: string;
  recoveryCount: number;
  trustScore: number;
  badges: string[];
  createdAt: string;
  isVerified: boolean;
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    profilePicture: "",
    preferredLanguage: "en",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(API_ENDPOINTS.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const profilePictureUrl = data.user.profilePicture
          ? data.user.profilePicture.startsWith("http")
            ? data.user.profilePicture
            : `${API_BASE_URL}${data.user.profilePicture}`
          : "";

        setUser({ ...data.user, profilePicture: profilePictureUrl });
        setFormData({
          username: data.user.username,
          email: data.user.email,
          profilePicture: profilePictureUrl,
          preferredLanguage: data.user.preferredLanguage,
        });
      } else {
        setError(data.message || "Failed to load profile");
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          router.push("/login");
        }
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.message || "Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(API_ENDPOINTS.PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || "",
        preferredLanguage: user.preferredLanguage,
      });
    }
    setIsEditing(false);
    setError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      const formDataUpload = new FormData();
      formDataUpload.append("profilePicture", file);

      const response = await fetch(API_ENDPOINTS.PROFILE_UPLOAD, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = `${API_BASE_URL}${data.profilePicture}`;
        setFormData({ ...formData, profilePicture: imageUrl });
        setSuccess("Image uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to upload image");
      }
    } catch (err: any) {
      setError(err.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(API_ENDPOINTS.PROFILE_DEACTIVATE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        router.push("/");
      } else {
        setError(data.message || "Failed to deactivate account");
        setShowDeactivateModal(false);
      }
    } catch (err: any) {
      setError(err.message || "Error deactivating account");
      setShowDeactivateModal(false);
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>Failed to load profile</p>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Back Button */}
        <button className="back-btn" onClick={() => router.back()}>
          ← Back
        </button>

        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.username} />
              ) : (
                <div className="avatar-placeholder">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-header-info">
              <h1>{user.username}</h1>
              <p className="profile-email">{user.email}</p>
              <div className="profile-badges">
                {user.isVerified && (
                  <span className="badge verified">Verified</span>
                )}
                {user.badges.map((badge, idx) => (
                  <span key={idx} className="badge">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Messages */}
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Edit Form or Display */}
        {isEditing ? (
          <div className="profile-edit-section">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                />
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.25rem",
                  }}
                >
                  Email cannot be changed
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="profilePicture">Profile Picture</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "2px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      {formData.profilePicture ? (
                        <img
                          src={formData.profilePicture}
                          alt="Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{ fontSize: "2rem", color: "var(--primary)" }}
                        >
                          {formData.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor="imageUpload"
                        style={{
                          display: "inline-block",
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "var(--primary)",
                          color: "white",
                          borderRadius: "0.5rem",
                          cursor: uploading ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          opacity: uploading ? 0.6 : 1,
                        }}
                      >
                        {uploading ? "Uploading..." : "Upload Photo"}
                      </label>
                      <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        style={{ display: "none" }}
                      />
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          marginTop: "0.5rem",
                        }}
                      >
                        JPG, PNG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                  <input
                    type="url"
                    id="profilePicture"
                    value={formData.profilePicture}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profilePicture: e.target.value,
                      })
                    }
                    placeholder="Or paste image URL"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="language">Preferred Language</label>
                <select
                  id="language"
                  value={formData.preferredLanguage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferredLanguage: e.target.value,
                    })
                  }
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setShowDeactivateModal(true)}
                  disabled={saving}
                >
                  Deactivate Account
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="profile-info-section">
            <h2>Profile Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Username</span>
                <span className="info-value">{user.username}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Preferred Language</span>
                <span className="info-value">
                  {user.preferredLanguage === "en" ? "English" : "Urdu"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Status</span>
                <span className="info-value">
                  {user.isVerified ? "✓ Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeactivateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Deactivate Account</h3>
            <p>
              Are you sure you want to deactivate your account? Your profile and
              items will be hidden, but you can reactivate by logging in again.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? "Deactivating..." : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
