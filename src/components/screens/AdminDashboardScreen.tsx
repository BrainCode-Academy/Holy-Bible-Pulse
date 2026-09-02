import React, { useState, useEffect } from 'react';
import { useBible } from '../../context/BibleContext';
import { APP_LOGO, APP_LOGO_ALT } from '../../constants/assets';
import {
  getAdminOverview,
  getAdminUsers,
  getAdminUserDetail,
  updateAdminUserStatus,
  getAdminAnalyticsData,
} from '../../services/authApi';
import {
  AnalyticsOverview,
  AdminUserListItem,
  AdminUserDetail,
} from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  Shield,
  Users,
  UserCheck,
  Calendar,
  Activity,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  BarChart3,
  BookOpen,
  Volume2,
  Bookmark,
  HeartHandshake,
  ArrowLeft,
  X,
  AlertTriangle,
  Lock,
  Compass,
} from 'lucide-react';

export const AdminDashboardScreen: React.FC = () => {
  const { user, setActiveTab } = useBible();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'analytics'>('overview');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    overview: AnalyticsOverview;
    registrationsByDay: Array<{ date: string; count: number }>;
    totalEvents: number;
  } | null>(null);

  // Users Tab State
  const [usersList, setUsersList] = useState<AdminUserListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Detail Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isAdmin = user && user.role === 'ADMIN';

  const loadData = async () => {
    if (!isAdmin) return;
    try {
      setIsRefreshing(true);
      const [ovData, anData, usData] = await Promise.all([
        getAdminOverview(),
        getAdminAnalyticsData(),
        getAdminUsers({ q: searchQuery, filter: filterType, page, limit: 15 }),
      ]);
      setOverview(ovData);
      setAnalyticsData(anData);
      setUsersList(usData.users || []);
      setTotalUsers(usData.total || 0);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, filterType, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleViewUser = async (userId: string) => {
    try {
      setIsLoadingDetail(true);
      const detail = await getAdminUserDetail(userId);
      setSelectedUserDetail(detail);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load user details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await updateAdminUserStatus(userId, { isActive: !currentActive });
      setActionSuccess(`User status successfully updated to ${!currentActive ? 'Active' : 'Suspended'}.`);
      loadData();
      if (selectedUserDetail && selectedUserDetail.id === userId) {
        setSelectedUserDetail({ ...selectedUserDetail, isActive: !currentActive });
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user status');
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: 'USER' | 'ADMIN') => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) return;

    try {
      await updateAdminUserStatus(userId, { role: nextRole });
      setActionSuccess(`User role successfully changed to ${nextRole}.`);
      loadData();
      if (selectedUserDetail && selectedUserDetail.id === userId) {
        setSelectedUserDetail({ ...selectedUserDetail, role: nextRole });
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user role');
    }
  };

  // Guard: Not an admin
  if (!isAdmin) {
    return (
      <div id="admin-access-denied" className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
          <Lock size={32} />
        </div>
        <h1 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
          Admin Access Required
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          You must be signed in with an Administrator account to view application metrics, usage analytics, and user account management.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            Go to Me / Sign In
          </button>
          <button
            onClick={() => setActiveTab('home')}
            className="w-full py-2.5 px-4 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl shadow-md border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={APP_LOGO}
            alt={APP_LOGO_ALT}
            className="w-14 h-14 rounded-2xl object-cover border border-amber-500/30 shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-500 text-stone-950 font-bold">
                <Shield size={13} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Admin Control Center
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif">Holy Bible+ Analytics &amp; Users</h1>
            <p className="text-xs text-stone-400">
              Real-time engagement telemetry, scripture activity counts, and user management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 text-stone-200"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition text-stone-200"
          >
            <ArrowLeft size={13} />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Activity size={14} />
          <span>Live Metrics</span>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'users'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Users size={14} />
          <span>User Accounts ({overview?.userMetrics?.totalUsers ?? totalUsers})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'analytics'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <BarChart3 size={14} />
          <span>Scripture &amp; Feature Trends</span>
        </button>
      </div>

      {/* 1. OVERVIEW / LIVE METRICS TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Users */}
            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
                <Users size={16} className="text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {overview?.totalUsers ?? totalUsers}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                +{overview?.newUsersToday ?? 0} today &bull; +{overview?.newUsersThisWeek ?? 0} this wk
              </div>
            </div>

            {/* DAU */}
            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Daily Active (DAU)</span>
                <Activity size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {overview?.activeToday ?? 0}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                WAU: {overview?.activeThisWeek ?? 0} &bull; MAU: {overview?.activeThisMonth ?? 0}
              </div>
            </div>

            {/* Total Sessions */}
            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">App Sessions</span>
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {overview?.totalSessions ?? 0}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Avg. ~{overview?.avgSessionDurationMinutes ?? 8.5} mins / session
              </div>
            </div>

            {/* Reading Plans Active */}
            <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-stone-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Plan Participants</span>
                <Calendar size={16} className="text-purple-600" />
              </div>
              <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                {overview?.readingPlanUsers ?? 0}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                {overview?.eventCounts?.prayer_created ?? 0} prayers &bull; {overview?.eventCounts?.audio_tts_played ?? 0} audio plays
              </div>
            </div>
          </div>

          {/* Feature Breakdown Table */}
          <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-600" />
              <span>Feature Usage &amp; Engagement Activity</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Chapters Read</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {(overview?.eventCounts?.chapter_read ?? 0) + (overview?.eventCounts?.reading_plan_chapter_read ?? 0)}
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Audio TTS Listens</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {overview?.eventCounts?.audio_tts_played ?? 0}
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Verses Bookmarked</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {overview?.eventCounts?.bookmark_added ?? 0}
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Verses Highlighted</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {overview?.eventCounts?.highlight_added ?? 0}
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Study Notes Logged</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {overview?.eventCounts?.note_created ?? 0}
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Scripture Searches</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {overview?.eventCounts?.search_performed ?? 0}
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Devotionals Read</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {overview?.eventCounts?.devotional_read ?? 0}
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <div className="text-[11px] text-stone-500 font-medium">Hymns Opened</div>
                <div className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                  {overview?.eventCounts?.hymn_viewed ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS MANAGEMENT TAB */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Users' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Suspended' },
                { id: 'google', label: 'Google Auth' },
                { id: 'email', label: 'Email Auth' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterType(f.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    filterType === f.id
                      ? 'bg-amber-700 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 border-b border-stone-200 dark:border-stone-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Auth Method</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                  {usersList.length > 0 ? (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              avatarUrl={u.avatarUrl}
                              profileImageType={u.profileImageType}
                              avatarId={u.avatarId}
                              avatarBgColor={u.avatarBgColor}
                              fullName={u.fullName}
                              size="sm"
                              roundedClassName="rounded-full"
                              borderClassName="border border-amber-500/40"
                            />
                            <div>
                              <div className="font-semibold text-stone-900 dark:text-stone-100">{u.fullName}</div>
                              <div className="text-[11px] text-stone-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[11px]">
                            {u.authProvider}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[11px] text-stone-500">
                          {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : 'Never'}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewUser(u.id)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                        No registered users found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCRIPTURE & FEATURE TRENDS TAB */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Books Read */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <BookOpen size={16} className="text-amber-600" />
                <span>Top Read Books of the Bible</span>
              </h2>

              <div className="space-y-2">
                {overview?.topContent?.topBooks && overview.topContent.topBooks.length > 0 ? (
                  overview.topContent.topBooks.map((b, i) => (
                    <div
                      key={b.bookId}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold text-stone-400">{i + 1}.</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{b.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded font-bold text-[11px]">
                        {b.count} reads
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-400 py-4 text-center">No book read logs recorded yet.</div>
                )}
              </div>
            </div>

            {/* Top Chapters Read */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Compass size={16} className="text-amber-600" />
                <span>Top Read Chapters</span>
              </h2>

              <div className="space-y-2">
                {overview?.topChapters && overview.topChapters.length > 0 ? (
                  overview.topChapters.map((c, i) => (
                    <div
                      key={c.chapterRef}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold text-stone-400">{i + 1}.</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{c.chapterRef}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded font-bold text-[11px]">
                        {c.count} reads
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-400 py-4 text-center">No chapter logs recorded yet.</div>
                )}
              </div>
            </div>

            {/* Top Search Terms */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Search size={16} className="text-amber-600" />
                <span>Most Searched Scripture Topics</span>
              </h2>

              <div className="space-y-2">
                {overview?.topSearchTerms && overview.topSearchTerms.length > 0 ? (
                  overview.topSearchTerms.map((t, i) => (
                    <div
                      key={t.term}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold text-stone-400">{i + 1}.</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">"{t.term}"</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded font-bold text-[11px]">
                        {t.count} queries
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-400 py-4 text-center">No searches recorded yet.</div>
                )}
              </div>
            </div>

            {/* Top Bible Versions */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <CheckCircle size={16} className="text-amber-600" />
                <span>Most Popular Bible Translations</span>
              </h2>

              <div className="space-y-2">
                {overview?.topVersions && overview.topVersions.length > 0 ? (
                  overview.topVersions.map((v, i) => (
                    <div
                      key={v.version}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold text-stone-400">{i + 1}.</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{v.version.toUpperCase()}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded font-bold text-[11px]">
                        {v.count} selections
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-stone-400 py-4 text-center">No version logs recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL MODAL */}
      {selectedUserDetail && (
        <div
          id="user-detail-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUserDetail(null);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserAvatar
                  avatarUrl={selectedUserDetail.avatarUrl}
                  profileImageType={selectedUserDetail.profileImageType}
                  avatarId={selectedUserDetail.avatarId}
                  avatarBgColor={selectedUserDetail.avatarBgColor}
                  fullName={selectedUserDetail.fullName}
                  size="md"
                  roundedClassName="rounded-full"
                  borderClassName="border border-amber-500/40"
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {selectedUserDetail.fullName}
                  </h3>
                  <p className="text-xs text-stone-400">{selectedUserDetail.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Account Metadata */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">User ID</span>
                  <span className="font-mono text-stone-700 dark:text-stone-300">{selectedUserDetail.id}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Auth Provider</span>
                  <span className="font-semibold capitalize text-stone-700 dark:text-stone-300">
                    {selectedUserDetail.authProvider}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Registered On</span>
                  <span className="text-stone-700 dark:text-stone-300">
                    {new Date(selectedUserDetail.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">Last Active</span>
                  <span className="text-stone-700 dark:text-stone-300">
                    {selectedUserDetail.lastActiveAt
                      ? new Date(selectedUserDetail.lastActiveAt).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              {/* Activity Counts */}
              <div className="space-y-1.5">
                <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[11px]">
                  User Engagement Counters
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl text-center">
                    <div className="text-base font-bold font-serif">{selectedUserDetail.bookmarksCount}</div>
                    <div className="text-[10px] text-stone-500">Bookmarks</div>
                  </div>
                  <div className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl text-center">
                    <div className="text-base font-bold font-serif">{selectedUserDetail.highlightsCount}</div>
                    <div className="text-[10px] text-stone-500">Highlights</div>
                  </div>
                  <div className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl text-center">
                    <div className="text-base font-bold font-serif">{selectedUserDetail.notesCount}</div>
                    <div className="text-[10px] text-stone-500">Notes</div>
                  </div>
                  <div className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl text-center">
                    <div className="text-base font-bold font-serif">{selectedUserDetail.plansCount}</div>
                    <div className="text-[10px] text-stone-500">Plans Enrolled</div>
                  </div>
                  <div className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl text-center">
                    <div className="text-base font-bold font-serif">{selectedUserDetail.prayersCount}</div>
                    <div className="text-[10px] text-stone-500">Prayers</div>
                  </div>
                  <div className="p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl text-center">
                    <div className="text-base font-bold font-serif">{selectedUserDetail.totalEventsCount}</div>
                    <div className="text-[10px] text-stone-500">Total Events</div>
                  </div>
                </div>
              </div>

              {/* Safe Activity Logs */}
              <div className="space-y-1.5">
                <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[11px]">
                  Recent Activity Logs (Anonymized &amp; Privacy-Safe)
                </span>
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl max-h-40 overflow-y-auto space-y-1.5 text-[11px]">
                  {selectedUserDetail.recentActivity && selectedUserDetail.recentActivity.length > 0 ? (
                    selectedUserDetail.recentActivity.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-stone-200/50 dark:border-stone-700/50 pb-1">
                        <span className="font-mono text-amber-800 dark:text-amber-300 font-semibold">{ev.eventType}</span>
                        <span className="text-stone-400">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-stone-400 text-center py-2">No recent logs recorded.</div>
                  )}
                </div>
              </div>

              {/* Status Controls */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleUserStatus(selectedUserDetail.id, selectedUserDetail.isActive)}
                  className={`py-2 px-3.5 rounded-xl font-semibold transition text-xs ${
                    selectedUserDetail.isActive
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {selectedUserDetail.isActive ? 'Suspend User Account' : 'Activate User Account'}
                </button>

                <button
                  onClick={() => handleToggleUserRole(selectedUserDetail.id, selectedUserDetail.role)}
                  className="py-2 px-3.5 rounded-xl font-semibold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs transition"
                >
                  {selectedUserDetail.role === 'ADMIN' ? 'Demote to Standard User' : 'Promote to Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
