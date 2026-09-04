import {
  User,
  AuthResponse,
  AnalyticsOverview,
  AdminUserListItem,
  AdminUserDetail,
  UserSyncPayload,
  ProfileImageType,
} from '../types';
import { apiUrl } from './apiConfig';

const TOKEN_KEY = 'hb_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 1. Register with Email & Password
export async function registerWithEmail(data: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  const targetUrl = apiUrl('/api/auth/register');
  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    console.error('[Auth] Network error during registration:', err);
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(json.error || 'Failed to create account.');
  }

  setStoredToken(json.token);
  return json;
}

// 2. Login with Email & Password
export async function loginWithEmail(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const targetUrl = apiUrl('/api/auth/login');
  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    console.error('[Auth] Network error during sign in:', err);
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(json.error || 'Failed to sign in.');
  }

  setStoredToken(json.token);
  return json;
}

// 3. Login with Google Credential
export async function loginWithGoogle(credential: string, clientId?: string): Promise<AuthResponse> {
  const targetUrl = apiUrl('/api/auth/google');
  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, clientId }),
    });
  } catch (err: any) {
    console.error('[Auth] Network error during Google sign-in:', err);
    throw new Error('Unable to connect to authentication server. Please try again.');
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(json.error || 'Failed to sign in with Google.');
  }

  setStoredToken(json.token);
  return json;
}

// 4. Get Current User Profile
export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(apiUrl('/api/auth/me'), {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setStoredToken(null);
      }
      return null;
    }

    const json = await res.json();
    return json.user;
  } catch {
    return null;
  }
}

// 5. Update Profile
export async function updateProfile(data: {
  fullName?: string;
  avatarUrl?: string | null;
  profileImageType?: ProfileImageType;
  avatarId?: string | null;
  avatarBgColor?: string | null;
}): Promise<User> {
  const res = await fetch(apiUrl('/api/auth/profile'), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to update profile.');
  }

  return json.user;
}

// 5.1 Upload Avatar Image (Real Photo)
export async function uploadAvatarImage(
  imageBase64: string,
  mimeType: string
): Promise<{ user: User; message: string; avatarUrl: string }> {
  const res = await fetch(apiUrl('/api/auth/profile/avatar'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Unable to save your profile picture. Please try again.');
  }

  return {
    user: json.user,
    message: json.message || 'Profile picture saved.',
    avatarUrl: json.avatarUrl,
  };
}

// 5.2 Choose Avatar
export async function chooseAvatar(
  avatarId: string,
  avatarBgColor?: string | null
): Promise<{ user: User; message: string }> {
  const res = await fetch(apiUrl('/api/auth/profile/avatar-choice'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ avatarId, avatarBgColor }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Unable to save your avatar. Please try again.');
  }

  return {
    user: json.user,
    message: json.message || 'Avatar updated successfully.',
  };
}

// 5.3 Remove Avatar Image
export async function removeAvatarImage(): Promise<{ user: User; message: string }> {
  const res = await fetch(apiUrl('/api/auth/profile/avatar'), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Unable to remove profile picture. Please try again.');
  }

  return {
    user: json.user,
    message: json.message || 'Profile picture removed successfully.',
  };
}

// 5.4 Migrate Legacy Base64 Avatar to Firebase Storage
export async function migrateAvatarToStorage(): Promise<{ user: User; message: string; migrated: boolean }> {
  const res = await fetch(apiUrl('/api/auth/profile/avatar/migrate'), {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to migrate avatar.');
  }

  return {
    user: json.user,
    message: json.message || 'Avatar migration completed.',
    migrated: Boolean(json.migrated),
  };
}

// 6. Request Password Reset
export async function requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string }> {
  const res = await fetch(apiUrl('/api/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to request password reset.');
  }

  return json;
}

// 7. Reset Password with Token
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/api/auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to reset password.');
  }

  return json;
}

// 8. Change Password (Authenticated)
export async function changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/api/auth/change-password'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to change password.');
  }

  return json;
}

// 9. Logout
export async function logoutUser(): Promise<void> {
  try {
    await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {}
  setStoredToken(null);
}

// 10. Sync User Data
export async function fetchUserSyncData(): Promise<UserSyncPayload | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(apiUrl('/api/user/sync'), {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function saveUserSyncData(payload: UserSyncPayload): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const res = await fetch(apiUrl('/api/user/sync'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch {
    return false;
  }
}

// --- ADMIN API CLIENT ---

export async function getAdminOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(apiUrl('/api/admin/overview'), {
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to load admin overview.');
  }

  return json;
}

export async function getAdminUsers(params?: {
  q?: string;
  filter?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; users: AdminUserListItem[] }> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.filter) query.set('filter', params.filter);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const res = await fetch(apiUrl(`/api/admin/users?${query.toString()}`), {
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to load users.');
  }

  return json;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const res = await fetch(apiUrl(`/api/admin/users/${userId}`), {
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to load user details.');
  }

  return json;
}

export async function updateAdminUserStatus(
  userId: string,
  updates: { isActive?: boolean; role?: 'USER' | 'ADMIN' }
): Promise<void> {
  const res = await fetch(apiUrl(`/api/admin/users/${userId}/status`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to update user status.');
  }
}

export async function getAdminAnalyticsData(): Promise<{
  overview: AnalyticsOverview;
  registrationsByDay: Array<{ date: string; count: number }>;
  totalEvents: number;
}> {
  const res = await fetch(apiUrl('/api/admin/analytics'), {
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to load analytics.');
  }

  return json;
}
