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

  const getProfilePictureUrl = (profilePicture?: string) => {
    if (!profilePicture) return "";
    return profilePicture.startsWith("http")
      ? profilePicture
      : `${API_BASE_URL}${profilePicture}`;
  };

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
        const profilePictureUrl = getProfilePictureUrl(data.user.profilePicture);

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
    } catch (err: unknown) {
      console.error("Profile fetch error:", err);
      setError(err instanceof Error ? err.message : "Error loading profile");
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
        const profilePictureUrl = getProfilePictureUrl(data.user.profilePicture);
        setUser({ ...data.user, profilePicture: profilePictureUrl });
        setFormData({
          username: data.user.username,
          email: data.user.email,
          profilePicture: profilePictureUrl,
          preferredLanguage: data.user.preferredLanguage,
        });
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error uploading image");
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deactivating account");
      setShowDeactivateModal(false);
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="page profile-loading">
        <div className="spinner" />
        <p className="muted">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page profile-error">
        <div className="empty-state">
          <h3>Failed to load profile</h3>
          <p>Please sign in again or try refreshing the page.</p>
          <button className="btn btn-primary" onClick={() => router.push("/login")}>
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="page profile-page">
      <div className="page-wide profile-shell">
        <button className="btn btn-ghost btn-sm profile-back" onClick={() => router.back()}>
          Back
        </button>

        <section className="profile-header surface">
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
              <span className="eyebrow">Profile</span>
              <h1 className="display">{user.username}</h1>
              <p className="profile-email muted">{user.email}</p>
              <div className="profile-badges">
                {user.isVerified && (
                  <span className="badge badge-active">Verified</span>
                )}
                {user.badges.map((badge, idx) => (
                  <span key={idx} className="badge badge-neutral">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </section>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {isEditing ? (
          <section className="profile-panel surface">
            <h2 className="section-title">Edit Profile</h2>
            <p className="section-sub">
              Keep your account details current so neighbors can reach the right
              person.
            </p>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="field">
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

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                />
                <p className="field-note">Email cannot be changed.</p>
              </div>

              <div className="field">
                <label htmlFor="profilePicture">Profile Picture</label>
                <div className="profile-picture-field">
                  <div className="profile-picture-row">
                    <div className="profile-avatar-preview">
                      {formData.profilePicture ? (
                        <img
                          src={formData.profilePicture}
                          alt="Preview"
                        />
                      ) : (
                        <span>{formData.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="profile-upload-copy">
                      <label
                        htmlFor="imageUpload"
                        className={`btn btn-secondary btn-sm upload-label ${
                          uploading ? "is-disabled" : ""
                        }`}
                      >
                        {uploading ? "Uploading..." : "Upload Photo"}
                      </label>
                      <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="file-input"
                      />
                      <p className="field-note">JPG, PNG, GIF up to 5MB.</p>
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

              <div className="field">
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
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowDeactivateModal(true)}
                  disabled={saving}
                >
                  Deactivate Account
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="profile-panel surface">
            <h2 className="section-title">Profile Information</h2>
            <p className="section-sub">
              Account details shown across your lost and found activity.
            </p>
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
                  {user.isVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trust Score</span>
                <span className="info-value">{user.trustScore}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Recoveries</span>
                <span className="info-value">{user.recoveryCount}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since</span>
                <span className="info-value">{memberSince}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {showDeactivateModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDeactivateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Deactivate Account</h3>
            <p>
              Are you sure you want to deactivate your account? Your profile and
              items will be hidden, but you can reactivate by logging in again.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? "Deactivating..." : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
