import { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { calculateFileHash } from '../lib/hasher';
import { subjectsMap } from '../lib/constants';
import {
  UploadCloud, CheckCircle, GraduationCap,
  Home as HomeIcon, Search, ChevronDown, Loader2, User,
  CalendarDays, BookOpen, Type, ShieldCheck,
  FileText, Clock, FileDigit, AlertTriangle, ArrowLeft, Check
} from 'lucide-react';
import { useUser, getInitials } from '../lib/user';

const navItems = [
  { label: 'Home', to: '/home', icon: HomeIcon },
  { label: 'Browse', to: '/library', icon: Search },
  { label: 'Upload', to: '/upload', icon: UploadCloud },
];

const categories = ['Notes', 'PYQ', 'Question Bank'];


export default function Upload() {
  const user = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('Notes');

  const [semester, setSemester] = useState<number | ''>('');
  const [subject, setSubject] = useState('');

  const [title, setTitle] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [examType, setExamType] = useState('');
  const [facultyName, setFacultyName] = useState('');

  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'success' | 'error' | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);


  useEffect(() => {
    setTitle('');
    setFacultyName('');
  }, [category]);



  const handleUploadClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setShowConfirm(true);
  };

  const executeUpload = async () => {
    if (!file) return;
    setShowConfirm(false);
    setIsUploading(true);
    setStatusTone('');
    try {
      setStatus('Analyzing document...');
      const fileHash = await calculateFileHash(file);

      let finalTitle = title;
      if (category === 'PYQ') {
        finalTitle = `${subject} ${examType} PYQ ${year}`;
      } else if (category === 'Question Bank') {
        finalTitle = `${title} (${examType} ${year})`;
      }

      setStatus('Requesting secure channel...');
      const presignRes = await axios.post('/api/files/request-upload', {
        title: finalTitle,
        semester,
        subject,
        category,
        fileHash,
        fileType: file.type,
        fileSize: file.size,
        year: category !== 'Notes' ? year : undefined,
        facultyName: category === 'Question Bank' ? facultyName : undefined,
        examType: category !== 'Notes' ? examType : undefined
      });

      const { uploadUrl, fileId } = presignRes.data;

      setStatus('Streaming to vault...');
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });

      setStatus('Finalizing records...');
      await axios.post('/api/files/confirm-upload', { fileId });

      setStatus('File uploaded successfully. It is now available in the library.');
      setStatusTone('success');
      setIsUploading(false);

      setTimeout(() => {
        setFile(null);
        setTitle('');
        setFacultyName('');
        setStatus('');
        setStatusTone('');
      }, 2000);

    } catch (err: any) {
      setStatus(err.response?.data?.error || 'Upload pipeline failed.');
      setStatusTone('error');
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setStatus('');
        setStatusTone('');
      } else {
        alert('Only PDF files are allowed in the vault.');
      }
    }
  };

  const currentYear = new Date().getFullYear();
  const recentYears = Array.from(new Array(10), (_, index) => currentYear - index);

  const isFormValid = () => {
    if (!file || !semester || !subject) return false;
    if (category === 'Notes' && !title.trim()) return false;
    if (category === 'PYQ' && (!examType || !year)) return false;
    if (category === 'Question Bank' && (!title.trim() || !examType || !year || !facultyName.trim())) return false;
    return true;
  };

  const renderConfirmModal = () => {
    if (!showConfirm || !file) return null;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div className="upload-modal-overlay">
        <div className="upload-modal">
          <div className="upload-modal-icon">
            <Check size={32} strokeWidth={3} />
          </div>
          <h2 className="upload-modal-title">Confirm Upload Details</h2>
          <p className="upload-modal-subtitle">
            Please review your resource information before publishing.<br />
            Once submitted, some details cannot be changed.
          </p>

          <div className="upload-receipt">
            <div className="upload-receipt-header">Resource Receipt</div>
            <div className="upload-receipt-body">
              <div className="upload-receipt-row">
                <span className="upload-receipt-label"><FileText size={16} /> Resource Type</span>
                <span className="upload-receipt-value"><FileText size={16} style={{ color: "var(--accent)" }} /> {category}</span>
              </div>
              <div className="upload-receipt-row">
                <span className="upload-receipt-label"><FileText size={16} /> File Name</span>
                <span className="upload-receipt-value" style={{ color: "var(--accent)" }}><FileText size={16} /> {file.name}</span>
              </div>
              <div className="upload-receipt-row">
                <span className="upload-receipt-label"><GraduationCap size={16} /> Semester</span>
                <span className="upload-receipt-value">Semester {semester}</span>
              </div>
              <div className="upload-receipt-row">
                <span className="upload-receipt-label"><BookOpen size={16} /> Subject</span>
                <span className="upload-receipt-value">{subject}</span>
              </div>
              {category !== 'Notes' && (
                <div className="upload-receipt-row">
                  <span className="upload-receipt-label"><CalendarDays size={16} /> Academic Year</span>
                  <span className="upload-receipt-value">{year}</span>
                </div>
              )}
              {category === 'Question Bank' && facultyName && (
                <div className="upload-receipt-row">
                  <span className="upload-receipt-label"><User size={16} /> Faculty</span>
                  <span className="upload-receipt-value">{facultyName}</span>
                </div>
              )}
              <div className="upload-receipt-row">
                <span className="upload-receipt-label"><Clock size={16} /> Upload Date</span>
                <span className="upload-receipt-value">{formattedDate}</span>
              </div>
              <div className="upload-receipt-row">
                <span className="upload-receipt-label"><FileDigit size={16} /> File Size</span>
                <span className="upload-receipt-value">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          <div className="upload-verification-notice">
            <AlertTriangle className="upload-verification-icon" size={20} strokeWidth={2.5} />
            <div className="upload-verification-text">
              <h4>Verification Notice</h4>
              <p>Incorrect metadata may make your resource difficult for students to find. Please ensure all information is accurate before publishing.</p>
            </div>
          </div>

          <div className="upload-modal-actions">
            <button className="upload-btn-secondary" onClick={() => setShowConfirm(false)}>
              <ArrowLeft size={18} /> Edit Details
            </button>
            <button className="upload-btn-primary" onClick={executeUpload}>
              <UploadCloud size={18} /> Publish Resource
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scholar-shell upload-shell">
      {renderConfirmModal()}

      {/* ========================================= */}
      {/* DESKTOP LAYOUT                            */}
      {/* ========================================= */}
      <div className="hidden md:block">
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

        <main className="upload-main">
          <header className="upload-header">
            <span className="upload-eyebrow">Secure Upload</span>
            <h1>Contribute to the Vault</h1>
            <p>Securely upload your academic resources for the community.</p>
          </header>

          <div className="upload-card">
            <form onSubmit={handleUploadClick} className="upload-form">
              <div
                className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf"
                  className="upload-file-input"
                  onChange={e => {
                    setFile(e.target.files?.[0] || null);
                    setStatus('');
                    setStatusTone('');
                  }}
                />

                {file ? (
                  <div className="upload-file-ready animate-in fade-in zoom-in">
                    <div className="upload-file-ready-icon">
                      <CheckCircle size={32} strokeWidth={2.5} />
                    </div>
                    <p className="upload-file-name">{file.name}</p>
                    <p className="upload-file-meta">{(file.size / 1024 / 1024).toFixed(2)} MB - Click to change file</p>
                  </div>
                ) : (
                  <>
                    <div className="upload-dropzone-icon">
                      <UploadCloud size={24} strokeWidth={2.5} />
                    </div>
                    <p className="upload-dropzone-title">Drag & drop your PDF here, or click to browse</p>
                    <div className="upload-dropzone-meta">
                      <span>Max 50MB</span>
                      <span className="upload-dot"></span>
                      <span>Private until reviewed</span>
                      <span className="upload-dot"></span>
                      <span>Secure vault</span>
                    </div>
                  </>
                )}
              </div>

              <div className="upload-type-row">
                <label className="upload-label upload-label-strong">Resource Type</label>
                <div className="upload-segmented">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`upload-segment ${category === cat ? 'active' : ''}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="upload-fields-panel">
                <div className="upload-select-wrap">
                  <CalendarDays className="upload-input-icon" size={20} strokeWidth={2} />
                  <select
                    className="upload-control upload-select has-icon"
                    value={semester}
                    onChange={e => {
                      const newSem = Number(e.target.value);
                      setSemester(newSem);
                      setSubject('');
                    }}
                  >
                    <option value="" disabled hidden>Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                  <ChevronDown size={16} strokeWidth={2.5} className="upload-select-icon" />
                </div>

                <div className="upload-select-wrap">
                  <BookOpen className="upload-input-icon" size={20} strokeWidth={2} />
                  <select
                    className="upload-control upload-select has-icon"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    disabled={!semester}
                  >
                    <option value="" disabled hidden>Select Subject</option>
                    {semester && subjectsMap[semester]?.map((sub: string) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} strokeWidth={2.5} className="upload-select-icon" />
                </div>

                {(category === 'PYQ' || category === 'Question Bank') && (
                  <>
                    <div className="upload-select-wrap animate-in fade-in slide-in-from-top-2">
                      <FileTextIcon />
                      <select
                        className="upload-control upload-select has-icon"
                        value={examType}
                        onChange={e => setExamType(e.target.value)}
                      >
                        <option value="" disabled hidden>Select Exam Type</option>
                        <option value="Mid Sem">Mid Sem</option>
                        <option value="End Sem">End Sem</option>
                      </select>
                      <ChevronDown size={16} strokeWidth={2.5} className="upload-select-icon" />
                    </div>

                    <div className="upload-select-wrap animate-in fade-in slide-in-from-top-2">
                      <CalendarDays className="upload-input-icon" size={20} strokeWidth={2} />
                      <select
                        className="upload-control upload-select has-icon"
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                      >
                        <option value="" disabled hidden>Select Academic Year</option>
                        {recentYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown size={16} strokeWidth={2.5} className="upload-select-icon" />
                    </div>
                  </>
                )}

                {(category === 'Notes' || category === 'Question Bank') && (
                  <div
                    className="upload-input-wrap animate-in fade-in slide-in-from-top-2"
                    style={category === 'Notes' ? { gridColumn: '1 / -1' } : {}}
                  >
                    <Type className="upload-input-icon" size={20} strokeWidth={2} />
                    <input
                      type="text"
                      placeholder={category === 'Notes' ? 'Enter Document Title (e.g. Unit 1 Summary)' : 'Enter Question Bank Title'}
                      required
                      className="upload-control upload-input has-icon"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                )}

                {category === 'Question Bank' && (
                  <div className="upload-input-wrap animate-in fade-in slide-in-from-top-2">
                    <User className="upload-input-icon" size={20} strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="Enter Faculty Name (e.g. Dr. Smith)"
                      required
                      className="upload-control upload-input has-icon"
                      value={facultyName}
                      onChange={e => setFacultyName(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="upload-submit-wrap">
                <button
                  type="submit"
                  disabled={!isFormValid() || isUploading || statusTone === 'success'}
                  className="upload-submit"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={20} className="upload-spinner" />
                      {status || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} strokeWidth={2.2} />
                      Execute Secure Upload
                    </>
                  )}
                </button>
              </div>

              {status && !isUploading && statusTone && (
                <p className={`upload-status ${statusTone} animate-in slide-in-from-bottom-2`}>
                  {statusTone === 'success' && <CheckCircle size={18} strokeWidth={2.5} />}
                  {status}
                </p>
              )}
            </form>
          </div>
        </main>

        <nav className="scholar-mobile-nav">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink key={label} to={to} className={`scholar-mobile-link focus:outline-none ${label === 'Upload' ? 'active' : ''}`}>
              <Icon size={21} strokeWidth={2.15} /><span>{label}</span>
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
        <div className="px-5 pt-6 pb-3 flex justify-between items-center bg-transparent">
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

        {/* Upload Form */}
        <div className="px-5 mt-4">
          {/* Header removed to push form higher up */}

          <form onSubmit={handleUploadClick}>
            {/* Tap to Upload Zone */}
            <div
              className={`w-full border-2 border-dashed rounded-xl p-4 mb-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-indigo-500 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 dark:border-indigo-500/50 dark:bg-indigo-500/10'}`}
              onClick={() => document.getElementById('file-upload-mobile')?.click()}
            >
              <input
                type="file"
                id="file-upload-mobile"
                accept=".pdf"
                className="hidden"
                onChange={e => {
                  setFile(e.target.files?.[0] || null);
                  setStatus('');
                  setStatusTone('');
                }}
              />
              {file ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <CheckCircle size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[var(--text)] truncate">{file.name}</p>
                    <p className="text-[12px] text-[var(--muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB - Tap to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full justify-center py-2">
                  <UploadCloud size={20} className="text-indigo-400 dark:text-indigo-500" strokeWidth={2.5} />
                  <span className="text-[15px] font-semibold text-[var(--text)]">Tap to Select PDF</span>
                </div>
              )}
            </div>

            {/* Resource Type */}
            <div className="mb-6">
              <label className="block text-[12px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase mb-2">Resource Type</label>
              <div className="flex bg-[var(--card)] border border-[var(--line)] rounded-lg p-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-colors ${category === cat ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--text)] hover:bg-[var(--line)]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Details Form (Vertical Full-Width Inputs) */}
            <div className="flex flex-col gap-3.5">

              <div>
                <label className="block text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase mb-1.5 px-1">Semester</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                    <CalendarDays size={18} strokeWidth={2.2} />
                  </div>
                  <select
                    className="w-full bg-[var(--card)] border border-[var(--line)] rounded-xl py-3.5 pl-[42px] pr-10 text-[15px] text-[var(--text)] appearance-none outline-none focus:border-indigo-500 font-medium"
                    value={semester}
                    onChange={e => {
                      const newSem = Number(e.target.value);
                      setSemester(newSem);
                      setSubject('');
                    }}
                  >
                    <option value="" disabled hidden>Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase mb-1.5 px-1">Subject</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                    <BookOpen size={18} strokeWidth={2.2} />
                  </div>
                  <select
                    className="w-full bg-[var(--card)] border border-[var(--line)] rounded-xl py-3.5 pl-[42px] pr-10 text-[15px] text-[var(--text)] appearance-none outline-none focus:border-indigo-500 font-medium disabled:opacity-50"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    disabled={!semester}
                  >
                    <option value="" disabled hidden>Select Subject</option>
                    {semester && subjectsMap[semester]?.map((sub: string) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {(category === 'PYQ' || category === 'Question Bank') && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase mb-1.5 px-1">Exam Type</label>
                    <div className="relative animate-in fade-in zoom-in-95 duration-200">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                        <FileText size={18} strokeWidth={2.2} />
                      </div>
                      <select
                        className="w-full bg-[var(--card)] border border-[var(--line)] rounded-xl py-3.5 pl-[42px] pr-10 text-[15px] text-[var(--text)] appearance-none outline-none focus:border-indigo-500 font-medium"
                        value={examType}
                        onChange={e => setExamType(e.target.value)}
                      >
                        <option value="" disabled hidden>Select Exam Type</option>
                        <option value="Mid Sem">Mid Sem</option>
                        <option value="End Sem">End Sem</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                        <ChevronDown size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase mb-1.5 px-1">Academic Year</label>
                    <div className="relative animate-in fade-in zoom-in-95 duration-200">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                        <Clock size={18} strokeWidth={2.2} />
                      </div>
                      <select
                        className="w-full bg-[var(--card)] border border-[var(--line)] rounded-xl py-3.5 pl-[42px] pr-10 text-[15px] text-[var(--text)] appearance-none outline-none focus:border-indigo-500 font-medium"
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                      >
                        <option value="" disabled hidden>Select Academic Year</option>
                        {recentYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                        <ChevronDown size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(category === 'Notes' || category === 'Question Bank') && (
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase mb-1.5 px-1">{category === 'Notes' ? 'Document Title' : 'Question Bank Title'}</label>
                  <div className="relative animate-in fade-in zoom-in-95 duration-200">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                      <Type size={18} strokeWidth={2.2} />
                    </div>
                    <input
                      type="text"
                      placeholder={category === 'Notes' ? 'e.g. Unit 1 Summary' : 'Enter Question Bank Title'}
                      required
                      className="w-full bg-[var(--card)] border border-[var(--line)] rounded-xl py-3.5 pl-[42px] pr-4 text-[15px] text-[var(--text)] outline-none focus:border-indigo-500 font-medium placeholder:text-[var(--muted)]"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {category === 'Question Bank' && (
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.05em] text-[var(--muted)] uppercase mb-1.5 px-1">Faculty Name</label>
                  <div className="relative animate-in fade-in zoom-in-95 duration-200">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)] dark:text-[#A1A1AA]">
                      <User size={18} strokeWidth={2.2} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Smith"
                      required
                      className="w-full bg-[var(--card)] border border-[var(--line)] rounded-xl py-3.5 pl-[42px] pr-4 text-[15px] text-[var(--text)] outline-none focus:border-indigo-500 font-medium placeholder:text-[var(--muted)]"
                      value={facultyName}
                      onChange={e => setFacultyName(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-8 mb-4">
              <button
                type="submit"
                disabled={!isFormValid() || isUploading || statusTone === 'success'}
                className="w-full py-4 rounded-xl font-bold text-[16px] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#5B4FF6] hover:bg-[#4a3fe0] shadow-[0_6px_24px_rgba(91,79,246,0.4)] disabled:shadow-none active:scale-[0.98]"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={20} className="upload-spinner animate-spin" />
                    {status || 'Uploading...'}
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} strokeWidth={2.2} />
                    Publish Resource
                  </>
                )}
              </button>
            </div>

            {/* Status Message */}
            {status && !isUploading && statusTone && (
              <div className={`p-4 rounded-xl flex items-center gap-2.5 text-[14px] font-bold animate-in slide-in-from-bottom-2 ${statusTone === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {statusTone === 'success' ? <CheckCircle size={20} strokeWidth={2.5} className="shrink-0" /> : <AlertTriangle size={20} strokeWidth={2.5} className="shrink-0" />}
                <span className="leading-snug">{status}</span>
              </div>
            )}

          </form>
        </div>

        {/* Mobile Nav Bottom Bar */}
        <nav className="scholar-mobile-nav">
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = label === 'Upload';
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

function FileTextIcon() {
  return <Type className="upload-input-icon" size={20} strokeWidth={2} />;
}
