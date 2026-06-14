import { useEffect, useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  Eye,
  FileText,
  GraduationCap,
  Home as HomeIcon,
  Moon,
  Search,
  Settings,
  Sun,
  ThumbsUp,
  UploadCloud,
  X
} from 'lucide-react';
import { timeAgo } from '../lib/formatTime';
import { getRecentViews, saveRecentView } from '../lib/recentViews';
import type { RecentFile } from '../lib/recentViews';
import { useUser, getInitials } from '../lib/user';

type FeedFile = RecentFile & {
  _id: string;
  title: string;
  subject: string;
  category?: string;
  fileUrl?: string;
  views?: number;
  upvotes?: number;
  hasUpvoted?: boolean; // NEW: Tracks if the current user upvoted this file
  createdAt?: string;
  uploaderId?: {
    _id?: string;
    name?: string;
    profilePicture?: string;
  };
};

const navItems = [
  { label: 'Home', to: '/home', icon: HomeIcon },
  { label: 'Browse', to: '/library', icon: Search },
  { label: 'Upload', to: '/upload', icon: UploadCloud },
  { label: 'Settings', to: '#', icon: Settings },
];

const avatarSrc = '/default-avatar.jpg';
const getSavedTheme = () => localStorage.getItem('mitrashare_theme') || 'dark';

export default function Home() {
  const user = useUser() as any;
  const [feed, setFeed] = useState<FeedFile[]>([]);
  const [recentViews, setRecentViews] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(getSavedTheme);
  const [showAllRecent, setShowAllRecent] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme', 'vault-dark-theme');
    } else {
      document.body.classList.remove('dark-theme', 'vault-dark-theme');
    }
    localStorage.setItem('mitrashare_theme', theme);
  }, [theme]);

  useEffect(() => {
    setRecentViews(getRecentViews());
    fetchStrictFeed();
  }, []);

  const fetchStrictFeed = async () => {
    try {
      const res = await axios.get('/api/users/feed');
      setFeed(res.data);
    } catch (error) {
      console.error('Failed to load feed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (file: any) => {
    saveRecentView({
      _id: file._id,
      title: file.title,
      subject: file.subject,
      uploaderName: file.uploaderId?.name || file.uploaderName || 'MitraShare User'
    } as any);

    setRecentViews(getRecentViews());
    setFeed((prev) => prev.map((f) => (f._id === file._id ? { ...f, views: (f.views || 0) + 1 } : f)));

    try {
      const res = await axios.get(`/api/files/${file._id}/view`);
      window.open(res.data.viewUrl, '_blank');
    } catch (error) {
      alert('Failed to securely connect to the document vault.');
    }
  };

  // UPDATED: Now toggles the upvote state (Add or Subtract)
  const handleOptimisticUpvote = async (file: FeedFile) => {
    const isUpvoted = Boolean(file.hasUpvoted);
    const fileId = file._id;
    const originalUpvotes = file.upvotes || 0;

    // Optimistically update the UI
    setFeed((prev) =>
      prev.map((f) =>
        f._id === fileId
          ? {
            ...f,
            upvotes: Math.max(0, (f.upvotes || 0) + (isUpvoted ? -1 : 1)),
            hasUpvoted: !isUpvoted
          }
          : f
      )
    );

    try {
      const res = await axios.post(`/api/files/${fileId}/upvote`);
      setFeed((prev) =>
        prev.map((f) =>
          f._id === fileId
            ? { ...f, upvotes: res.data.upvotes, hasUpvoted: res.data.hasUpvoted }
            : f
        )
      );
    } catch (error) {
      // If the API fails, revert the UI back to what it was
      setFeed((prev) =>
        prev.map((f) =>
          f._id === fileId
            ? {
              ...f,
              upvotes: originalUpvotes,
              hasUpvoted: isUpvoted
            }
            : f
        )
      );
    }
  };

  const getFileBadge = (url?: string) => {
    const ext = url?.split('.').pop()?.toUpperCase() || 'PDF';
    return ext.substring(0, 4);
  };

  return (
    <div className="scholar-shell">

      {/* ========================================= */}
      {/* SETTINGS SIDEBAR                          */}
      {/* ========================================= */}
      <div className={`scholar-sidebar-overlay ${isSettingsOpen ? 'open' : ''}`} onClick={() => setIsSettingsOpen(false)} />

      <div className={`scholar-sidebar-panel ${isSettingsOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Settings</h2>
          <button className="sidebar-close focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md" onClick={() => setIsSettingsOpen(false)}>
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="sidebar-content">
          <button className="sidebar-item focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-2" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
            <div className="sidebar-item-left">
              {theme === 'light' ? <Moon size={20} strokeWidth={2.2} /> : <Sun size={20} strokeWidth={2.2} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="sidebar-toggle-track">
              <div className="sidebar-toggle-thumb"></div>
            </div>
          </button>

          <button className="sidebar-item focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-2">
            <div className="sidebar-item-left">
              <Bell size={20} strokeWidth={2.2} />
              <span>Notifications</span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* DESKTOP TOP NAVIGATION                    */}
      {/* ========================================= */}
      <div className="hidden md:block">
        <nav className="scholar-topbar">
          <NavLink to="/home" className="scholar-brand">
            <span className="scholar-brand-mark"><GraduationCap size={21} strokeWidth={2.35} /></span>
            <span>MitraShare</span>
          </NavLink>
          <div className="scholar-nav-list">
            {navItems.map(({ label, to, icon: Icon }) => (
              label === 'Settings' ? (
                <button key={label} onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} className="scholar-nav-link">
                  <Icon size={18} strokeWidth={2.1} /><span>{label}</span>
                </button>
              ) : (
                <NavLink key={label} to={to} className="scholar-nav-link">
                  <Icon size={18} strokeWidth={2.1} /><span>{label}</span>
                </NavLink>
              )
            ))}
          </div>
          <NavLink to="/profile" className="scholar-topbar-profile">
            <div className="scholar-avatar-initials">{getInitials(user?.name)}</div>
          </NavLink>
        </nav>

        <main className="scholar-main">
          <header className="scholar-hero">
            <div>
              <h1>Resource Feed</h1>
              <p>Latest resources for your semester</p>
            </div>
            <NavLink to="/profile" className="scholar-profile-mobile focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full">
              <div className="scholar-avatar-initials">{getInitials(user?.name)}</div>
            </NavLink>
          </header>

          {recentViews.length > 0 && (
            <section className="scholar-section" aria-labelledby="jump-back-in-title">
              <h2 id="jump-back-in-title">Jump Back In</h2>
              <div className="recent-strip">
                {recentViews.slice(0, 5).map((file: any) => (
                  <button
                    key={file._id}
                    type="button"
                    className="recent-card active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#060607]"
                    onClick={() => handleViewFile(file)}
                  >
                    <div className="recent-card-header">
                      <span className="recent-card-icon">
                        <FileText size={20} strokeWidth={2.15} />
                      </span>
                      <span className="recent-card-subject" title={file.subject}>
                        {file.subject}
                      </span>
                    </div>
                    <div className="recent-card-footer">
                      <span className="recent-card-title">{file.title}</span>
                      <span className="recent-card-uploader">By {file.uploaderName || 'Student'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="scholar-section" aria-labelledby="class-feed-title">
            <h2 id="class-feed-title">Resource Feed</h2>

            {loading ? (
              <div className="feed-stack" aria-label="Loading resources">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="resource-card-loading" style={{ height: '280px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : feed.length === 0 ? (
              <div className="empty-feed">
                <FileText size={28} strokeWidth={1.8} />
                <p>No files uploaded for your semester yet.</p>
              </div>
            ) : (
              <div className="feed-stack">
                {feed.map((file) => (
                  <article key={file._id} className="resource-card">
                    <NavLink to={`/profile/${file.uploaderId?._id}`} className="resource-author" style={{ textDecoration: 'none' }}>
                      <img src={file.uploaderId?.profilePicture || avatarSrc} alt="" />
                      <div>
                        <p className="resource-author-name">{file.uploaderId?.name || 'MitraShare User'}</p>
                        <p className="resource-time">{file.createdAt ? timeAgo(file.createdAt) : 'Recently'}</p>
                      </div>
                    </NavLink>

                    <h3>{file.title}</h3>

                    <div className="resource-meta">
                      <span className="pill pill-subject">{file.subject}</span>
                      {file.category && <span className="pill pill-category">{file.category}</span>}
                      <span className="views">
                        <Eye size={18} strokeWidth={2} />
                        {(file.views || 0).toLocaleString()} views
                      </span>
                      <span className={`file-badge file-badge-${getFileBadge(file.fileUrl).toLowerCase()}`}>
                        {getFileBadge(file.fileUrl)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="open-document active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#181819]"
                      onClick={() => handleViewFile(file)}
                    >
                      <FileText size={20} strokeWidth={2.25} />
                      Open Document
                    </button>

                    <div className="resource-actions">
                      <button
                        type="button"
                        // UPDATED: Dynamically add the "upvoted" class if true
                        className={`upvote-button focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${file.hasUpvoted ? 'upvoted' : ''}`}
                        onClick={() => handleOptimisticUpvote(file)} // Notice we now pass the whole file object
                      >
                        {/* UPDATED: Dynamically fill the icon if true */}
                        <ThumbsUp size={20} strokeWidth={1.95} fill={file.hasUpvoted ? "currentColor" : "none"} />
                        <span>{file.hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                        <strong>{file.upvotes || 0}</strong>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <nav className="scholar-mobile-nav" aria-label="Mobile navigation" onClick={() => isSettingsOpen && setIsSettingsOpen(false)}>
          {navItems.map(({ label, to, icon: Icon }) => (
            label === 'Settings' ? (
              <button key={label} onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} className="scholar-mobile-link focus:outline-none focus-visible:text-indigo-400">
                <Icon size={21} strokeWidth={2.15} />
                <span>{label}</span>
              </button>
            ) : (
              <NavLink key={label} to={to} className="scholar-mobile-link focus:outline-none focus-visible:text-indigo-400">
                <Icon size={21} strokeWidth={2.15} />
                <span>{label}</span>
              </NavLink>
            )
          ))}
        </nav>
      </div>

      {/* ========================================= */}
      {/* MOBILE LAYOUT                             */}
      {/* ========================================= */}
      <div className="block md:hidden bg-[var(--page)] text-[var(--text)] min-h-screen pb-24 font-sans absolute inset-0 z-0 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-6 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="scholar-brand-mark flex items-center justify-center bg-indigo-600 text-white rounded-md w-[28px] h-[28px] shadow-sm">
              <GraduationCap size={18} strokeWidth={2.5} />
            </span>
            <h1 className="text-[22px] font-bold text-[var(--text)] tracking-tight">MitraShare</h1>
          </div>
          <NavLink to="/profile" className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold border-2 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] text-white shrink-0">
            {getInitials(user?.name)}
          </NavLink>
        </div>

        {/* Search Bar */}
        <div className="px-5 mb-6">
          <div className="bg-[var(--card)] rounded-xl flex items-center px-4 py-3.5 border border-[var(--line)] shadow-sm">
            <Search size={18} className="text-[var(--muted)] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search notes, PYQs, assignments..."
              className="bg-transparent border-none outline-none text-[15px] text-[var(--text)] w-full placeholder:text-[var(--muted)] font-medium"
            />
          </div>
        </div>

        {/* Continue Reading */}
        {recentViews.length > 0 && (
          <div className="mb-8">
            <div className="px-5 flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 border-l-[3px] border-indigo-500 pl-2">
                <h2 className="text-[13px] font-bold tracking-[0.15em] text-[var(--text)] uppercase">Continue Reading</h2>
              </div>
              <button
                className="text-indigo-400 text-[13px] font-bold"
                onClick={() => setShowAllRecent(!showAllRecent)}
              >
                {showAllRecent ? 'Show less' : 'See all'}
              </button>
            </div>

            <div className={`flex gap-4 px-5 pb-2 ${showAllRecent ? 'flex-col' : 'overflow-x-auto'}`} style={{ scrollbarWidth: 'none' }}>
              {(showAllRecent ? recentViews : recentViews.slice(0, 3)).map((file: any) => (
                <div key={file._id} onClick={() => handleViewFile(file)} className={`flex-none bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 flex flex-col justify-between cursor-pointer shadow-lg hover:border-[var(--accent)] transition-colors ${showAllRecent ? 'w-full' : 'w-[240px]'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20" title={file.subject}>
                        {file.subject}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--text)] text-[14px] leading-tight mb-2 line-clamp-2">{file.title}</h3>
                    <p className="text-[11px] text-[var(--muted)] mb-5 font-medium line-clamp-1">By {file.uploaderName || 'Student'}</p>
                  </div>

                  <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-indigo-500/50">
                    Continue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resource Feed */}
        <div className="px-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 border-l-[3px] border-purple-500 pl-2">
              <h2 className="text-[13px] font-bold tracking-[0.15em] text-[var(--text)] uppercase">Resource Feed</h2>
            </div>
          </div>

          {loading ? (
            <div className="feed-stack" aria-label="Loading resources">
              {[1, 2, 3].map((item) => (
                <div key={item} className="resource-card-loading" style={{ height: '280px', borderRadius: '8px' }} />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="empty-feed">
              <FileText size={28} strokeWidth={1.8} />
              <p>No files uploaded for your semester yet.</p>
            </div>
          ) : (
            <div className="feed-stack">
              {feed.map((file) => (
                <article key={file._id} className="resource-card">
                  <NavLink to={`/profile/${file.uploaderId?._id}`} className="resource-author" style={{ textDecoration: 'none' }}>
                    <img src={file.uploaderId?.profilePicture || avatarSrc} alt="" />
                    <div>
                      <p className="resource-author-name">{file.uploaderId?.name || 'MitraShare User'}</p>
                      <p className="resource-time">{file.createdAt ? timeAgo(file.createdAt) : 'Recently'}</p>
                    </div>
                  </NavLink>

                  <h3>{file.title}</h3>

                  <div className="resource-meta">
                    <span className="pill pill-subject">{file.subject}</span>
                    {file.category && <span className="pill pill-category">{file.category}</span>}
                    <span className="views">
                      <Eye size={18} strokeWidth={2} />
                      {(file.views || 0).toLocaleString()} views
                    </span>
                    <span className={`file-badge file-badge-${getFileBadge(file.fileUrl).toLowerCase()}`}>
                      {getFileBadge(file.fileUrl)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="open-document active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#181819]"
                    onClick={() => handleViewFile(file)}
                  >
                    <FileText size={20} strokeWidth={2.25} />
                    Open Document
                  </button>

                  <div className="resource-actions">
                    <button
                      type="button"
                      // UPDATED: Dynamically add the "upvoted" class if true
                      className={`upvote-button focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${file.hasUpvoted ? 'upvoted' : ''}`}
                      onClick={() => handleOptimisticUpvote(file)} // Notice we now pass the whole file object
                    >
                      {/* UPDATED: Dynamically fill the icon if true */}
                      <ThumbsUp size={20} strokeWidth={1.95} fill={file.hasUpvoted ? "currentColor" : "none"} />
                      <span>{file.hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                      <strong>{file.upvotes || 0}</strong>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Nav Bottom Bar */}
        <nav className="scholar-mobile-nav" onClick={() => isSettingsOpen && setIsSettingsOpen(false)}>
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = label === 'Home';
            return label === 'Settings' ? (
              <button key={label} onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} className={`scholar-mobile-link focus:outline-none ${isActive ? 'active' : ''}`}>
                <Icon size={21} strokeWidth={2.15} />
                <span>{label}</span>
              </button>
            ) : (
              <NavLink key={label} to={to} className={`scholar-mobile-link focus:outline-none ${isActive ? 'active' : ''}`}>
                <Icon size={21} strokeWidth={2.15} />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
