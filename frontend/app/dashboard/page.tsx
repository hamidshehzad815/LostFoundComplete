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
    } catch (error: unknown) {
      console.error("Error fetching dashboard data:", error);
      const message = error instanceof Error ? error.message : "";
      if (
        message.includes("Token expired") ||
        message.includes("Authentication")
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

  const formatLabel = (value?: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

  if (loading) {
    return (
      <div className="page dashboard-loading">
        <div className="spinner" />
        <p className="muted">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="page">
      <div className="page-wide dashboard-shell">
        <button className="btn btn-ghost btn-sm dashboard-back" onClick={() => router.back()}>
          Back
        </button>

        <section className="dashboard-header surface">
          <div className="dashboard-user">
            {dashboardStats?.user.profilePicture ? (
              <img
                src={
                  dashboardStats.user.profilePicture.startsWith("http")
                    ? dashboardStats.user.profilePicture
                    : withApiBase(dashboardStats.user.profilePicture)
                }
                alt="Profile"
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                {dashboardStats?.user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="dashboard-intro">
              <span className="eyebrow">Your dashboard</span>
              <h1 className="display">{dashboardStats?.user.username || "Account"}</h1>
              <p className="muted">
                {dashboardStats?.user.email}
                <span aria-hidden="true"> · </span>
                Trust score {dashboardStats?.user.trustScore || 0}
                <span aria-hidden="true"> · </span>
                {dashboardStats?.user.recoveryCount || 0} recoveries
              </p>
              {dashboardStats?.user.badges &&
                dashboardStats.user.badges.length > 0 && (
                  <div className="dashboard-badges">
                    {dashboardStats.user.badges.map((badge, index) => (
                      <span key={index} className="badge badge-neutral">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
          <div className="dashboard-actions">
            <button
              className="btn btn-lost"
              onClick={() => handlePostClick("lost")}
            >
              Post Lost Item
            </button>
            <button
              className="btn btn-found"
              onClick={() => handlePostClick("found")}
            >
              Post Found Item
            </button>
          </div>
        </section>

        <section className="stats-grid" aria-label="Dashboard statistics">
          <div className="stat-card surface">
            <h2 className="stat-value">{quickStats?.totalItems || 0}</h2>
            <p className="stat-label">Total Posts</p>
          </div>

          <div className="stat-card surface">
            <h2 className="stat-value">{quickStats?.activeItems || 0}</h2>
            <p className="stat-label">Active</p>
          </div>

          <div className="stat-card surface">
            <h2 className="stat-value">{quickStats?.resolvedItems || 0}</h2>
            <p className="stat-label">Resolved</p>
          </div>

          <div className="stat-card surface">
            <h2 className="stat-value">
              {dashboardStats?.overview.lostItems || 0}
            </h2>
            <p className="stat-label">Lost</p>
          </div>

          <div className="stat-card surface">
            <h2 className="stat-value">
              {dashboardStats?.overview.foundItems || 0}
            </h2>
            <p className="stat-label">Found</p>
          </div>

          <div className="stat-card surface">
            <h2 className="stat-value">{quickStats?.totalViews || 0}</h2>
            <p className="stat-label">Views</p>
          </div>
        </section>

        <section>
          <div className="dashboard-section-heading">
            <div>
              <h2 className="section-title">Insights</h2>
              <p className="section-sub">
                A concise view of recovery progress and current attention.
              </p>
            </div>
          </div>

          <div className="insights-row">
            <div className="insight-card surface">
              <span className="insight-label">Success Rate</span>
              <span className="insight-value">
                {dashboardStats?.successRate || 0}%
              </span>
              <div className="insight-bar">
                <div
                  className="insight-bar-fill"
                  style={{ width: `${dashboardStats?.successRate || 0}%` }}
                />
              </div>
            </div>

            <div className="insight-card surface">
              <span className="insight-label">Average Resolution</span>
              <span className="insight-value">
                {dashboardStats?.averageResolutionTime || 0} <small>days</small>
              </span>
            </div>

            <div className="insight-card surface">
              <span className="insight-label">Pending Claims</span>
              <span className="insight-value">
                {quickStats?.pendingClaims || 0}
              </span>
            </div>

            {dashboardStats && dashboardStats.overview.totalBookmarks > 0 && (
              <div className="insight-card surface">
                <span className="insight-label">Bookmarks</span>
                <span className="insight-value">
                  {dashboardStats.overview.totalBookmarks}
                </span>
              </div>
            )}

            {dashboardStats && dashboardStats.overview.totalRewards > 0 && (
              <div className="insight-card surface">
                <span className="insight-label">Rewards</span>
                <span className="insight-value">
                  Rs. {dashboardStats.overview.totalRewards}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="activity-section surface">
          <div className="dashboard-section-heading">
            <div>
              <h2 className="section-title">Recent Activity</h2>
              <p className="section-sub">
                Recent posts and their recovery signals.
              </p>
            </div>
          </div>

          {dashboardStats?.recentActivity &&
          dashboardStats.recentActivity.length > 0 ? (
            <div className="activity-list">
              {dashboardStats.recentActivity.map((activity) => (
                <button
                  key={activity.id}
                  className={`activity-item ${activity.type}`}
                  onClick={() => router.push(`/item/${activity.id}`)}
                >
                  <div className="activity-info">
                    <h4 className="activity-title">{activity.title}</h4>
                    <div className="activity-meta">
                      <span
                        className={`badge ${
                          activity.type === "lost" ? "badge-lost" : "badge-found"
                        }`}
                      >
                        {formatLabel(activity.type)}
                      </span>
                      <span>{activity.category}</span>
                      <span>
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="activity-right">
                    <div className="activity-numbers">
                      <span>{activity.views} views</span>
                      <span>{activity.claimsCount} claims</span>
                    </div>
                    <span
                      className={`badge ${
                        activity.status === "active"
                          ? "badge-active"
                          : activity.status === "resolved"
                            ? "badge-resolved"
                            : "badge-neutral"
                      }`}
                    >
                      {formatLabel(activity.status)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No activity yet</h3>
              <p>Post your first lost or found item to begin tracking activity.</p>
              <button
                className="btn btn-primary"
                onClick={() => router.push("/post")}
              >
                Create a post
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
