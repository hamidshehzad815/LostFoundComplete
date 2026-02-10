"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, isAuthenticated } from "@/lib/auth";
import { API_ENDPOINTS, withApiBase } from "@/lib/config";
import "./dashboard.css";

interface QuickStats {
  totalItems: number;
  activeItems: number;
  resolvedItems: number;
  pendingClaims: number;
  totalViews: number;
}

interface DashboardStats {
  user: {
    username: string;
    email: string;
    profilePicture: string;
    recoveryCount: number;
    trustScore: number;
    badges: string[];
  };
  overview: {
    totalPosts: number;
    activePosts: number;
    resolvedPosts: number;
    lostItems: number;
    foundItems: number;
    totalViews: number;
    totalRewards: number;
    totalBookmarks: number;
    totalClaims: number;
  };
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    category: string;
    date: string;
    views: number;
    claimsCount: number;
  }>;
  successRate: number;
  averageResolutionTime: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [showPostModal, setShowPostModal] = useState(false);
  const [postType, setPostType] = useState<"lost" | "found">("lost");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const [quickResponse, detailedResponse] = await Promise.all([
        fetch(API_ENDPOINTS.DASHBOARD_QUICK_STATS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(API_ENDPOINTS.DASHBOARD_STATS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (quickResponse.status === 401 || detailedResponse.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        router.push("/login?error=session_expired");
        return;
      }

      if (quickResponse.ok) {
        const quickData = await quickResponse.json();
        setQuickStats(quickData.data);
      }

      if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json();
        setDashboardStats(detailedData.data);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      if (
        error.message?.includes("Token expired") ||
        error.message?.includes("Authentication")
      ) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        router.push("/login?error=session_expired");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (type: "lost" | "found") => {
    router.push(`/post?type=${type}`);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Back Button */}
      <button className="back-btn" onClick={() => router.back()}>
        ← Back
      </button>

      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            {dashboardStats?.user.profilePicture ? (
              <img
                src={
                  dashboardStats.user.profilePicture.startsWith("http")
                    ? dashboardStats.user.profilePicture
                    : withApiBase(dashboardStats.user.profilePicture)
                }
                alt="Profile"
                className="user-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : (
              <div className="user-avatar-placeholder">
                {dashboardStats?.user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1>{dashboardStats?.user.username}</h1>
              <p className="user-subtitle">
                Trust Score: {dashboardStats?.user.trustScore || 0} •
                Recoveries: {dashboardStats?.user.recoveryCount || 0}
              </p>
            </div>
          </div>
          <div className="quick-actions">
            <button
              className="action-btn action-btn-lost"
              onClick={() => handlePostClick("lost")}
            >
              Post Lost Item
            </button>
            <button
              className="action-btn action-btn-found"
              onClick={() => handlePostClick("found")}
            >
              Post Found Item
            </button>
          </div>
        </div>

        {/* Badges */}
        {dashboardStats?.user.badges &&
          dashboardStats.user.badges.length > 0 && (
            <div className="badges-container">
              {dashboardStats.user.badges.map((badge, index) => (
                <span key={index} className="badge">
                  {badge}
                </span>
              ))}
            </div>
          )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h2 className="stat-value">{quickStats?.totalItems || 0}</h2>
            <p className="stat-label">Total Posts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h2 className="stat-value">{quickStats?.activeItems || 0}</h2>
            <p className="stat-label">Active</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h2 className="stat-value">{quickStats?.resolvedItems || 0}</h2>
            <p className="stat-label">Resolved</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <h2 className="stat-value">
              {dashboardStats?.overview.lostItems || 0}
            </h2>
            <p className="stat-label">Lost</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-content">
            <h2 className="stat-value">
              {dashboardStats?.overview.foundItems || 0}
            </h2>
            <p className="stat-label">Found</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h2 className="stat-value">{quickStats?.totalViews || 0}</h2>
            <p className="stat-label">Views</p>
          </div>
        </div>
      </div>

      {/* Quick Insights Row */}
      <div className="insights-row">
        <div className="insight-card">
          <span className="insight-label">Success Rate</span>
          <span className="insight-value">
            {dashboardStats?.successRate || 0}%
          </span>
          <div className="insight-bar">
            <div
              className="insight-bar-fill"
              style={{ width: `${dashboardStats?.successRate || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="insight-card">
          <span className="insight-label">Avg Resolution</span>
          <span className="insight-value">
            {dashboardStats?.averageResolutionTime || 0} <small>days</small>
          </span>
        </div>

        <div className="insight-card">
          <span className="insight-label">Claims</span>
          <span className="insight-value">
            {quickStats?.pendingClaims || 0}
          </span>
        </div>

        {dashboardStats && dashboardStats.overview.totalBookmarks > 0 && (
          <div className="insight-card">
            <span className="insight-label">Bookmarks</span>
            <span className="insight-value">
              {dashboardStats.overview.totalBookmarks}
            </span>
          </div>
        )}

        {dashboardStats && dashboardStats.overview.totalRewards > 0 && (
          <div className="insight-card">
            <span className="insight-label">Rewards</span>
            <span className="insight-value">
              Rs. {dashboardStats.overview.totalRewards}
            </span>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {dashboardStats?.recentActivity &&
        dashboardStats.recentActivity.length > 0 && (
          <div className="activity-section">
            <h3 className="section-title">Recent Activity</h3>
            <div className="activity-list">
              {dashboardStats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`activity-item ${activity.type}`}
                  onClick={() => router.push(`/item/${activity.id}`)}
                >
                  <div className="activity-type-icon">
                    {activity.type === "lost" ? "🔴" : "🟢"}
                  </div>
                  <div className="activity-info">
                    <h4 className="activity-title">{activity.title}</h4>
                    <div className="activity-meta">
                      <span>{activity.category}</span>
                      <span>
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="activity-right">
                    <div className="activity-numbers">
                      <span>👁️ {activity.views}</span>
                      <span>💬 {activity.claimsCount}</span>
                    </div>
                    <div className={`activity-status ${activity.status}`}>
                      {activity.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Empty State */}
      {(!dashboardStats?.recentActivity ||
        dashboardStats.recentActivity.length === 0) && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No Activity Yet</h3>
          <p>Post your first lost or found item to get started!</p>
        </div>
      )}
    </div>
  );
}
