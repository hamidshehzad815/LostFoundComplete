export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500";
export const API_AUTH_URL = `${API_BASE_URL}/auth/api`;
export const API_DASHBOARD_URL = `${API_BASE_URL}/api/dashboard`;
export const API_ITEMS_URL = `${API_BASE_URL}/api/items`;
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL;
export const API_MESSAGES_URL = `${API_BASE_URL}/api/messages`;

export const withApiBase = (path: string) =>
  path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

export const API_ENDPOINTS = {
  LOGIN: `${API_AUTH_URL}/login`,
  REGISTER: `${API_AUTH_URL}/register`,
  PROFILE: `${API_AUTH_URL}/profile`,
  PROFILE_UPLOAD: `${API_AUTH_URL}/profile/upload`,
  PROFILE_DEACTIVATE: `${API_AUTH_URL}/profile/deactivate`,
  GOOGLE_AUTH: `${API_AUTH_URL}/google`,
  GOOGLE_CALLBACK: `${API_AUTH_URL}/google/callback`,

  DASHBOARD_STATS: `${API_DASHBOARD_URL}/stats`,
  DASHBOARD_QUICK_STATS: `${API_DASHBOARD_URL}/quick-stats`,
  DASHBOARD_ACTIVE_ITEMS: `${API_DASHBOARD_URL}/active-items`,
  DASHBOARD_PENDING_CLAIMS: `${API_DASHBOARD_URL}/pending-claims`,
  DASHBOARD_TIME_STATS: `${API_DASHBOARD_URL}/time-stats`,
  DASHBOARD_TOP_ITEMS: `${API_DASHBOARD_URL}/top-items`,
  DASHBOARD_ITEMS: `${API_DASHBOARD_URL}/items`,
  DASHBOARD_RECENT_ACTIVITY: `${API_DASHBOARD_URL}/recent-activity`,

  ITEMS: `${API_ITEMS_URL}`,
  ITEMS_SEARCH: `${API_ITEMS_URL}/search-by-location`,
  MESSAGES: `${API_MESSAGES_URL}`,
  MESSAGES_CONVERSATIONS: `${API_MESSAGES_URL}/conversations`,
  MESSAGES_UNREAD_COUNT: `${API_MESSAGES_URL}/unread/count`,
};
