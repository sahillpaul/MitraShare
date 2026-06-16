import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  Search, Eye, ArrowUpRight, ChevronDown, GraduationCap, 
  Home as HomeIcon, UploadCloud, Settings, Moon, Sun, Bell, X
} from 'lucide-react';
import { subjectsMap } from '../lib/constants';
import { useUser, getInitials } from '../lib/user';

const navItems = [
  { label: 'Home', to: '/home', icon: HomeIcon },
  { label: 'Browse', to: '/library', icon: Search },
  { label: 'Upload', to: '/upload', icon: UploadCloud },
];



export default function Library() {
  const user = useUser() as any;
  // --- States ---
  const [semester, setSemester] = useState(user?.semester || 1);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [hasSetDefault, setHasSetDefault] = useState(false);
  useEffect(() => {
    if (user?.semester && !hasSetDefault) {
      setSemester(user.semester);
      setHasSetDefault(true);
    }
  }, [user?.semester, hasSetDefault]);
  
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  


  // --- Effects ---
  useEffect(() => {
    const controller = new AbortController();
    fetchFiles(controller.signal);

    return () => controller.abort();
  }, [semester, subject, category]);

  // --- Data Fetching ---
  const fetchFiles = async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError('');
    try {
      const params: Record<string, string | number> = { semester };
      if (subject) params.subject = subject;
      if (category) params.category = category;

      const res = await axios.get('/api/files/library', {
        params,
        signal,
        timeout: 10000,
      });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Failed to load files", error);
        setFiles([]);
        setLoadError('Could not load resources. Please try again.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleViewFile = async (fileId: string) => {
    try {
      const res = await axios.get(`/api/files/${fileId}/view`);
      window.open(res.data.viewUrl, '_blank');
    } catch (error) {
      alert("Failed to securely connect to the document vault.");
    }
  };

  // --- Client-Side Search ---
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files.filter(file => 
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      file.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const getFileBadge = (url?: string) => {
    const ext = url?.split('.').pop()?.toUpperCase() || 'PDF';
    return ext.substring(0, 4);
  };

  return (
    <div className="scholar-shell">

      {/* ========================================= */}
      {/* DESKTOP LAYOUT                            */}
      {/* ========================================= */}
      <div className="hidden md:block">
        <nav className="scholar-topbar">
          <NavLink to="/home" className="scholar-brand">
            <span className="scholar-brand-mark"><GraduationCap size={21} strokeWidth={2.35} /></span>
            <span>MitraShare</span>
          </NavLink>
          <div className="scholar-nav-list">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink key={label} to={to} className="scholar-nav-link">
                <Icon size={18} strokeWidth={2.1} /><span>{label}</span>
              </NavLink>
            ))}
            <div className="scholar-nav-link" style={{ paddingLeft: '12px' }}>
              <ThemeToggle />
            </div>
          </div>
          <NavLink to="/profile" className="scholar-topbar-profile">
            <div className="scholar-avatar-initials">{getInitials(user?.name)}</div>
          </NavLink>
        </nav>

        <main className="library-main">
          
          <header className="library-header">
            <h1 className="library-title">Library Vault</h1>
            <p className="library-subtitle">
              Search, filter, and access every resource in your secure academic vault
            </p>
            
            {/* SEARCH BAR */}
            <div className="library-search-wrap">
              <Search className="library-search-icon" size={20} strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Search for subjects, topics, or files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="library-search-input"
              />
            </div>

            {/* FILTER CONTROL CENTER */}
            <div className="library-filter-panel">
              
              <div className="library-filter-header">
                <span className="library-filter-eyebrow">Semester Progression</span>
                <span className="library-filter-current">Semester {semester}</span>
              </div>

              {/* SEMESTER TIMELINE SLIDER */}
              <div className="semester-timeline">
                {/* Background Track */}
                <div className="semester-track" />
                {/* Progress Track (Accent Color) */}
                <div 
                  className="semester-progress" 
                  style={{ width: `${((semester - 1) / 7) * 100}%` }} 
                />

                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button 
                    key={num}
                    onClick={() => { setSemester(num); setSubject(''); setCategory(''); }}
                    className={`semester-button
                      ${semester === num 
                        ? 'active' 
                        : semester > num 
                          ? 'complete'
                          : 'upcoming'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* SECONDARY FILTERS */}
              <div className="library-filter-row">
                <div className="library-select-wrap">
                  <select 
                    className="library-select" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="">Subject</option>
                    {subjectsMap[semester]?.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="library-select-icon" />
                </div>
                
                <div className="library-select-wrap">
                  <select 
                    className="library-select" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Category</option>
                    <option value="Notes">Notes</option>
                    <option value="PYQ">PYQs</option>
                    <option value="Question Bank">Question Banks</option>
                    <option value="Syllabus">Syllabus</option>
                  </select>
                  <ChevronDown size={14} strokeWidth={2.5} className="library-select-icon" />
                </div>
              </div>
            </div>
          </header>

          {/* --- PREMIUM BENTO-BOX GRID --- */}
          {loading ? (
            <div className="library-grid">
              {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="resource-card-loading library-loading-card" />)}
            </div>
          ) : loadError ? (
            <div className="library-empty">
              <Search size={40} strokeWidth={1.5} />
              <p>{loadError}</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="library-empty">
              <Search size={40} strokeWidth={1.5} />
              <p>No resources found in this section.</p>
            </div>
          ) : (
            <div className="library-grid">
              {filteredFiles.map(file => (
                <div 
                  key={file._id} 
                  onClick={() => handleViewFile(file._id)}
                  className="library-card"
                >
                  {/* Card Top: Badge & Views */}
                  <div className="library-card-top">
                    <span className={`vault-badge vault-badge-${getFileBadge(file.fileUrl).toLowerCase()}`}>
                      {getFileBadge(file.fileUrl)}
                    </span>
                    <span className="library-card-views">
                      <Eye size={14} strokeWidth={2.5} /> {(file.views || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Card Middle: Title */}
                  <h3 className="library-card-title">
                    {file.title}
                  </h3>

                  {/* Card Bottom: Subject & Size */}
                  <div className="library-card-meta">
                    <span className="vault-pill-subject">{file.subject}</span>
                    <span className="library-file-size">
                      {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>

                  {/* Card Footer: Uploader & Hover Arrow */}
                  <div className="library-card-footer">
                    <NavLink 
                      to={`/profile/${file.uploaderId?._id}`} 
                      className="library-uploader"
                      style={{ textDecoration: 'none', color: 'inherit', position: 'relative', zIndex: 10 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Uploaded by {file.uploaderId?.name || 'MitraShare User'}
                    </NavLink>
                    
                    <div className="library-card-arrow">
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <nav className="scholar-mobile-nav" aria-label="Mobile navigation">
          {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink key={label} to={to} className="scholar-mobile-link focus:outline-none focus-visible:text-indigo-400">
                <Icon size={21} strokeWidth={2.15} />
                <span>{label}</span>
              </NavLink>
          ))}
          <div className="scholar-mobile-link flex items-center justify-center">
            <ThemeToggle />
          </div>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[15px] text-[var(--text)] w-full placeholder:text-[var(--muted)] font-medium"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 mb-6">
          {/* THUMB-FRIENDLY SEMESTER SCROLL */}
          <div className="flex overflow-x-auto gap-2 pb-2 mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' as any }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <button 
                key={num}
                onClick={() => { setSemester(num); setSubject(''); setCategory(''); }}
                className={`flex-none px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  semester === num 
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' 
                    : 'bg-[var(--card)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--accent)]'
                }`}
              >
                Sem {num}
              </button>
            ))}
          </div>

          {/* SIDE-BY-SIDE DROPDOWNS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select 
                className="w-full appearance-none bg-[var(--card)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] transition-colors" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Subject</option>
                {subjectsMap[semester]?.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            </div>
            
            <div className="relative">
              <select 
                className="w-full appearance-none bg-[var(--card)] border border-[var(--line)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[var(--accent)] transition-colors" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Category</option>
                <option value="Notes">Notes</option>
                <option value="PYQ">PYQs</option>
                <option value="Question Bank">Question Banks</option>
                <option value="Syllabus">Syllabus</option>
              </select>
              <ChevronDown size={14} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* --- COMPACT LIST VIEW --- */}
        <div className="px-5">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="resource-card-loading h-20 rounded-xl" />
              ))}
            </div>
          ) : loadError ? (
            <div className="library-empty">
              <Search size={40} strokeWidth={1.5} />
              <p>{loadError}</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="library-empty">
              <Search size={40} strokeWidth={1.5} />
              <p>No resources found in this section.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredFiles.map(file => {
                const ext = getFileBadge(file.fileUrl);
                let badgeColors = "bg-indigo-500/20 text-indigo-400 border-indigo-500/20";
                if (ext === 'PDF') badgeColors = "bg-red-500/20 text-red-400 border-red-500/20";
                else if (ext === 'DOC' || ext === 'DOCX') badgeColors = "bg-blue-500/20 text-blue-400 border-blue-500/20";
                else if (ext === 'XLS' || ext === 'XLSX') badgeColors = "bg-green-500/20 text-green-400 border-green-500/20";
                else if (ext === 'PPT' || ext === 'PPTX') badgeColors = "bg-orange-500/20 text-orange-400 border-orange-500/20";

                return (
                  <div 
                    key={file._id} 
                    onClick={() => handleViewFile(file._id)}
                    className="flex items-center gap-4 p-3 bg-[var(--card)] border border-[var(--line)] rounded-xl cursor-pointer hover:border-[var(--accent)] transition-colors shadow-sm"
                  >
                    {/* Left: Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${badgeColors}`}>
                      <span className="text-[11px] font-bold tracking-wider">{ext}</span>
                    </div>

                    {/* Middle: Info */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1 (The Title) */}
                      <h3 className="text-[14px] font-semibold text-[var(--text)] leading-tight mb-1 truncate">
                        {file.title}
                      </h3>
                      {/* Row 2 (The Specs) */}
                      <div className="text-[11px] text-[var(--muted)] font-medium truncate mb-1.5">
                        {file.subject} &bull; {(file.fileSize ? (file.fileSize / 1024 / 1024).toFixed(1) : '0.0')} MB
                      </div>
                      {/* Row 3 (The Author) */}
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] font-medium truncate">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-300 border border-indigo-500/30 shrink-0">
                          {file.uploaderId?.name ? getInitials(file.uploaderId.name) : 'S'}
                        </div>
                        <span className="truncate">By {file.uploaderId?.name || 'Student'}</span>
                      </div>
                    </div>

                    {/* Right: Meta */}
                    <div className="flex flex-col items-center justify-center shrink-0 pr-1">
                      <div className="flex items-center gap-1.5 text-[var(--muted)] text-[11px] font-bold">
                        <Eye size={14} strokeWidth={2.5} /> 
                        {(file.views || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Nav Bottom Bar */}
        <nav className="scholar-mobile-nav">
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = label === 'Browse';
            return (
              <NavLink key={label} to={to} className={`scholar-mobile-link focus:outline-none ${isActive ? 'active' : ''}`}>
                <Icon size={21} strokeWidth={2.15} />
                <span>{label}</span>
              </NavLink>
            )
          })}
          <div className="scholar-mobile-link flex items-center justify-center pt-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </div>
  );
}
