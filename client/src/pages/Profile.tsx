import { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  GraduationCap, Home as HomeIcon, Search, UploadCloud,
  Trash2, Eye, ThumbsUp, MapPin, Edit3
} from 'lucide-react';
import { timeAgo } from '../lib/formatTime';
import { useUser, getInitials } from '../lib/user';

const navItems = [
  { label: 'Home', to: '/home', icon: HomeIcon },
  { label: 'Browse', to: '/library', icon: Search },
  { label: 'Upload', to: '/upload', icon: UploadCloud },
];

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [myUploads, setMyUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  const currentUser = useUser() as any;
  const isOwnProfile = !id || (currentUser && id === currentUser._id);



  useEffect(() => {
    fetchProfileData();
  }, [id, currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      if (!id || (currentUser && id === currentUser._id)) {
        // OWN profile: reuse the already-fetched currentUser from useUser() hook
        // Only fetch uploads separately to avoid the duplicate /api/users/me call
        if (!currentUser) return; // Wait for useUser() to resolve first
        setUser(currentUser);
        const res = await axios.get('/api/users/me');
        setMyUploads(res.data.uploads || []);
      } else {
        // OTHER user's profile: single call
        const res = await axios.get(`/api/users/${id}`);
        setUser(res.data.user);
        setMyUploads(res.data.uploads || []);
      }
    } catch (error) {
      console.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    const confirmDelete = window.confirm("Delete this resource permanently?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/files/${fileId}`);
      setMyUploads(prev => prev.filter(file => file._id !== fileId));
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete file.");
    }
  };

  const handleViewFile = async (fileId: string) => {
    try {
      const res = await axios.get(`/api/files/${fileId}/view`);
      window.open(res.data.viewUrl, '_blank');
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to open document.");
    }
  };

  const getFileBadgeClass = (url?: string) => {
    const ext = url?.split('.').pop()?.toUpperCase() || 'PDF';
    if (ext === 'PDF') return 'vault-badge-pdf';
    if (ext === 'DOC' || ext === 'DOCX') return 'vault-badge-doc';
    if (ext === 'XLS' || ext === 'XLSX') return 'vault-badge-xls';
    return 'vault-badge-pdf';
  };

  const getFileBadge = (url?: string) => {
    const ext = url?.split('.').pop()?.toUpperCase() || 'PDF';
    return ext.substring(0, 4);
  };

  const totalUploads = myUploads.length;
  const totalUpvotes = myUploads.reduce((sum, file) => sum + (file.upvotes || 0), 0);
  const totalViews = myUploads.reduce((sum, file) => sum + (file.views || 0), 0);



  return (
    <div className="vault-shell">


      {/* --- DESKTOP NAV --- */}
              <nav className="flex items-center justify-between w-full h-[72px] px-6 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--line)] sticky top-0 z-20">
          {/* Left Zone: Logo */}
          <NavLink to="/home" className="flex items-center gap-3 text-[22px] font-extrabold tracking-tight flex-shrink-0 w-48">
            <span className="w-10 h-10 flex items-center justify-center text-white bg-[var(--accent)] rounded-[10px] shadow-lg shadow-[var(--accent)]/30"><GraduationCap size={22} strokeWidth={2.35} /></span>
            <span className="text-[var(--text)]">MitraShare</span>
          </NavLink>

          {/* Center Zone: Navigation Links */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-8">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink 
                key={label} 
                to={to} 
                className={({ isActive }) => 
                  `flex items-center gap-2 text-[15px] font-bold px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' 
                      : 'text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--text)]'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2.2} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Zone: Utilities */}
          <div className="flex items-center justify-end gap-5 flex-shrink-0 w-48">
            <ThemeToggle />
            <NavLink to="/profile" className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
              <div className="w-[42px] h-[42px] flex items-center justify-center text-white bg-[var(--accent)] border-2 border-[var(--line)] rounded-full text-[14px] font-extrabold shadow-sm">
                {getInitials(user?.name)}
              </div>
            </NavLink>
          </div>
        </nav>

      <main className="profile-main hidden md:block">
        {loading ? (
          <>
            <div className="profile-card">
              <div className="profile-header-top">
                <div className="profile-user-info w-full flex gap-5 items-center">
                  <div className="resource-card-loading w-24 h-24 rounded-full shrink-0"></div>
                  <div className="flex flex-col gap-3 w-full max-w-sm">
                    <div className="resource-card-loading h-8 w-3/4 rounded-md"></div>
                    <div className="resource-card-loading h-4 w-1/2 rounded-md"></div>
                    <div className="resource-card-loading h-4 w-1/3 rounded-md"></div>
                  </div>
                </div>
              </div>
              <div className="profile-stats-grid">
                {[1, 2, 3].map(n => (
                  <div key={n} className="profile-stat-box h-[88px] resource-card-loading border-none shadow-none"></div>
                ))}
              </div>
            </div>

            <div className="profile-tabs">
              <div className="profile-tab">{isOwnProfile ? "My Uploads" : "Uploads"}</div>
            </div>

            <div className="profile-uploads-list">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="profile-upload-item h-[104px] resource-card-loading border-none shadow-none"></div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* --- PROFILE HEADER & STATS --- */}
            <div className="profile-card">
              <div className="profile-header-top">
                <div className="profile-user-info">
                  <div className="profile-avatar-large">
                    {getInitials(user?.name)}
                    <div className="profile-status-dot"></div>
                  </div>
                  <div>
                    <div className="profile-name-row">
                      <h1 className="profile-name">{user?.name || 'Aarav Rao'}</h1>
                      <span className="profile-active-badge">Active</span>
                    </div>
                    <p className="profile-email">Semester {user?.semester || '4'} • {user?.email || 'aarav@example.com'}</p>
                    <div className="profile-details">
                      <div className="profile-detail-item">
                        <GraduationCap size={16} />
                        <span>Computer Science Engineering</span>
                      </div>
                      <div className="profile-detail-divider"></div>
                      <div className="profile-detail-item">
                        <MapPin size={16} />
                        <span>Amravati, India</span>
                      </div>
                    </div>
                  </div>
                </div>
                {isOwnProfile && (
                  <div className="profile-actions">
                    <button className="profile-btn-primary" onClick={() => navigate('/edit-profile')}>
                      <Edit3 size={16} strokeWidth={2.5} /> Edit Profile
                    </button>
                  </div>
                )}
              </div>

              <div className="profile-stats-grid">
                <div className="profile-stat-box">
                  <div className="profile-stat-value">{totalUploads}</div>
                  <div className="profile-stat-label">Total Uploads</div>
                </div>
                <div className="profile-stat-box">
                  <div className="profile-stat-value highlight">{totalUpvotes}</div>
                  <div className="profile-stat-label">Upvotes Received</div>
                </div>
                <div className="profile-stat-box">
                  <div className="profile-stat-value">{totalViews.toLocaleString()}</div>
                  <div className="profile-stat-label">Total Views</div>
                </div>
              </div>
            </div>

            {/* --- CONTRIBUTIONS LIST --- */}
            <div className="profile-tabs">
              <div className="profile-tab">{isOwnProfile ? "My Uploads" : "Uploads"}</div>
            </div>

            {myUploads.length === 0 ? (
              <div className="profile-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <UploadCloud size={48} className="mx-auto text-[var(--vault-muted)] mb-4" />
                <h3 className="text-xl font-bold text-[var(--vault-text)] mb-2">No uploads yet</h3>
                <p className="text-[var(--vault-muted)] font-medium">
                  {isOwnProfile ? "Head over to the Upload page to start contributing!" : "This user hasn't uploaded anything yet."}
                </p>
              </div>
            ) : (
              <div className="profile-uploads-list">
                {myUploads.map(file => (
                  <div key={file._id} className="profile-upload-item">
                    <div className="profile-upload-left">
                      <div className={`profile-upload-icon ${getFileBadgeClass(file.fileUrl)}`}>
                        {getFileBadge(file.fileUrl)}
                      </div>
                      <div className="profile-upload-info">
                        <div className="profile-upload-title-row">
                          <h3 className="profile-upload-title">{file.title}</h3>
                          <span className="vault-pill-subject">{file.subject}</span>
                        </div>
                        <p className="profile-upload-meta">
                          Uploaded {timeAgo(file.createdAt)} • {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>

                    <div className="profile-upload-right">
                      <div className="profile-upload-stats hidden sm:flex">
                        <span className="profile-upload-stat"><Eye size={18} strokeWidth={2.5} /> {file.views || 0}</span>
                        <span className="profile-upload-stat"><ThumbsUp size={18} strokeWidth={2.5} /> {file.upvotes || 0}</span>
                      </div>
                      <div className="profile-upload-actions">
                        <button
                          onClick={() => handleViewFile(file._id)}
                          className="profile-btn-open"
                        >
                          <Eye size={16} strokeWidth={2.5} /> Open
                        </button>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="profile-upload-delete"
                            title="Delete"
                          >
                            <Trash2 size={20} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================= */}
      {/* MOBILE LAYOUT                             */}
      {/* ========================================= */}
      <div className="block md:hidden bg-[var(--vault-bg)] text-[var(--vault-text)] min-h-screen pb-24 font-sans absolute inset-0 z-0 overflow-y-auto relative">

        {/* HALO GLOW */}
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[var(--vault-accent)]/20 blur-[100px] rounded-full pointer-events-none z-0"></div>

        {/* Header */}
        <div className="relative z-10 px-5 pt-6 pb-2 flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-2.5">
            <span className="scholar-brand-mark flex items-center justify-center bg-[var(--vault-accent)] text-white rounded-md w-[28px] h-[28px] shadow-sm">
              <GraduationCap size={18} strokeWidth={2.5} />
            </span>
            <h1 className="text-[22px] font-bold text-[var(--vault-text)] tracking-tight">MitraShare</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NavLink to="/profile" className="w-9 h-9 rounded-full bg-[var(--vault-accent)] flex items-center justify-center text-sm font-bold border-2 border-[var(--vault-accent)] shadow-[0_0_15px_rgba(91,79,246,0.4)] text-white shrink-0">
            {getInitials(user?.name)}
          </NavLink>
          </div>
        </div>

        {/* 1. Identity Section */}
        <div className="relative z-10 px-5 pt-6 mb-6">
          <div className="bg-[var(--vault-card)]/80 backdrop-blur-xl border border-[var(--vault-line)] rounded-[2rem] p-6 flex flex-col items-center shadow-lg">
            {loading ? (
              <>
                <div className="w-24 h-24 rounded-full mb-4 resource-card-loading border-none"></div>
                <div className="h-6 w-40 rounded mb-2 resource-card-loading border-none"></div>
                <div className="h-4 w-32 rounded mb-5 resource-card-loading border-none"></div>
                <div className="h-10 w-36 rounded-full mt-1 resource-card-loading border-none"></div>
              </>
            ) : (
              <>
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-[var(--vault-bg)] flex items-center justify-center text-[32px] font-black text-[var(--vault-accent)] mb-4 border border-[var(--vault-line)] shadow-xl relative z-10">
                  {getInitials(user?.name)}
                </div>

                {/* Name Row */}
                <div className="flex items-center justify-center gap-2 mb-1 w-full">
                  <h1 className="text-[22px] font-bold text-[var(--vault-text)] tracking-tight">{user?.name || 'Sahil Paul'}</h1>
                  <span className="bg-[var(--vault-accent)]/15 text-[var(--vault-accent)] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">ACTIVE</span>
                </div>

                {/* Meta-Data */}
                <div className="flex flex-col items-center gap-0.5 mb-5">
                  <p className="text-[var(--vault-muted)] text-[13px] font-medium tracking-wide">Sem {user?.semester || '1'} • {user?.course || 'Computer Science'}</p>
                  <p className="text-[var(--vault-muted)] text-[13px] font-medium tracking-wide">{user?.email || 'sahilpaul046@gmail.com'}</p>
                </div>

                {/* Action */}
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/edit-profile')}
                    className="px-8 py-2.5 rounded-full border border-[var(--vault-line)] bg-[var(--vault-surface)] text-[var(--vault-text)] text-[14px] font-bold tracking-wide flex items-center justify-center active:bg-[var(--vault-accent)] active:text-white active:border-[var(--vault-accent)] hover:bg-[var(--vault-accent)] hover:text-white hover:border-[var(--vault-accent)] transition-colors mt-1 shadow-sm"
                  >
                    Edit Profile
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 2. Analytics Pill */}
        <div className="relative z-10 px-5 mb-8">
          {loading ? (
            <div className="h-[84px] rounded-full w-full resource-card-loading border-none shadow-none"></div>
          ) : (
            <div className="flex justify-between items-center bg-[var(--vault-card)] rounded-full py-4 px-6 shadow-md border border-[var(--vault-line)]">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[26px] font-black text-[var(--vault-text)] leading-none mb-1">{totalUploads}</span>
                <span className="text-[10px] font-bold text-[var(--vault-muted)] tracking-[0.05em] uppercase">Uploads</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[26px] font-black text-[var(--vault-accent)] leading-none mb-1">{totalUpvotes}</span>
                <span className="text-[10px] font-bold text-[var(--vault-muted)] tracking-[0.05em] uppercase">Upvotes</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[26px] font-black text-[var(--vault-text)] leading-none mb-1">{totalViews > 999 ? (totalViews / 1000).toFixed(1) + 'k' : totalViews}</span>
                <span className="text-[10px] font-bold text-[var(--vault-muted)] tracking-[0.05em] uppercase">Views</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Content Area */}
        <div className="px-5">
          <h2 className="text-[18px] font-extrabold text-[var(--vault-text)] mb-6">{isOwnProfile ? 'My Contributions' : 'Contributions'}</h2>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-[var(--vault-card)] border-none rounded-xl h-[116px] resource-card-loading shadow-sm"></div>
              ))}
            </div>
          ) : myUploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <UploadCloud size={48} strokeWidth={1.5} className="text-[var(--vault-muted)] opacity-50 mb-2" />
              <p className="text-[var(--vault-muted)] text-[15px] font-bold mb-1">No uploads yet</p>
              <p className="text-[var(--vault-muted)] text-[13px] opacity-70 text-center">{isOwnProfile ? 'Head to the Upload tab to start contributing.' : "This user hasn't uploaded anything yet."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {myUploads.map(file => (
                <div key={file._id} className="bg-[var(--vault-card)] border border-[var(--vault-line)] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-[var(--vault-text)] truncate">{file.title}</h3>
                      <p className="text-[12px] font-bold text-[var(--vault-muted)] mt-1 uppercase tracking-wider">{file.subject}</p>
                    </div>
                    <span className="bg-[var(--vault-line)] text-[var(--vault-muted)] text-[10px] font-bold px-2 py-1 rounded">
                      {getFileBadge(file.fileUrl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--vault-line)]">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--vault-muted)]">
                        <Eye size={14} strokeWidth={2.5} /> {file.views || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--vault-muted)]">
                        <ThumbsUp size={14} strokeWidth={2.5} /> {file.upvotes || 0}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleViewFile(file._id)} className="w-8 h-8 rounded-full bg-[var(--vault-line)] text-[var(--vault-text)] flex items-center justify-center active:scale-95 transition-transform hover:bg-[var(--vault-muted)] hover:text-white">
                        <Eye size={14} strokeWidth={2.5} />
                      </button>
                      {isOwnProfile && (
                        <button onClick={() => handleDelete(file._id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center active:scale-95 transition-transform">
                          <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="scholar-mobile-nav sm:hidden">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={label} to={to} className={({ isActive }) => isActive ? "scholar-mobile-link active" : "scholar-mobile-link"}>
            <Icon size={22} strokeWidth={2.5} />
            {label}
          </NavLink>
        ))}
        
      </nav>
    </div>
  );
}