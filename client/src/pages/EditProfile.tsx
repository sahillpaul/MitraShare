import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import { GraduationCap, Lock, LogOut } from 'lucide-react';
import { getInitials } from '../lib/user';

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    semester: 1
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await axios.get('/api/users/me');
      setUser(res.data.user);
      setFormData({
        name: res.data.user.name,
        semester: res.data.user.semester
      });
    } catch (error) {
      console.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'semester' ? parseInt(value) : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.patch('/api/users/me', formData);
      // Update local cache so navigation feels instant
      if (res.data.user) {
        localStorage.setItem('mitrashare_user_cache', JSON.stringify(res.data.user));
      }
      navigate('/profile');
    } catch (error: any) {
      console.error("Failed to update profile:", error.response?.data || error.message);
      alert(`Failed to update profile: ${error.response?.data?.error || "Please try again."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('mitrashare_user_cache');
    navigate('/login');
  };



  return (
    <div className="vault-shell edit-profile-page">
      {/* --- MINIMAL DESKTOP NAV --- */}
      <nav className="scholar-topbar justify-between">
        <NavLink to="/home" className="scholar-brand">
          <span className="scholar-brand-mark"><GraduationCap size={21} strokeWidth={2.35} /></span>
          <span>MitraShare</span>
        </NavLink>
        
        <NavLink to="/profile" className="scholar-topbar-profile">
          <div className="scholar-avatar-initials">{getInitials(user?.name)}</div>
        </NavLink>
      </nav>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden px-5 pt-6 pb-3 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-2.5">
          <span className="scholar-brand-mark flex items-center justify-center bg-[#5B4FF6] text-white rounded-md w-[28px] h-[28px] shadow-sm">
            <GraduationCap size={18} strokeWidth={2.5} />
          </span>
          <h1 className="text-[22px] font-bold text-[var(--vault-text)] tracking-tight">MitraShare</h1>
        </div>
        <NavLink to="/profile" className="w-9 h-9 rounded-full bg-[#5B4FF6] flex items-center justify-center text-sm font-bold border-2 border-[#5B4FF6] shadow-[0_0_15px_rgba(91,79,246,0.4)] text-white shrink-0">
          {getInitials(user?.name)}
        </NavLink>
      </div>

      <main className="edit-profile-main">
        <div className="profile-card edit-profile-container">
          {loading ? (
            <>
              <div className="edit-profile-header">
                <div className="resource-card-loading w-24 h-24 rounded-full mb-4 border-none shadow-none mx-auto"></div>
                <div className="resource-card-loading h-8 w-48 rounded-md mb-2 border-none shadow-none mx-auto"></div>
                <div className="resource-card-loading h-4 w-32 rounded-md border-none shadow-none mx-auto"></div>
              </div>

              <div className="edit-profile-form">
                <div className="edit-profile-field">
                  <div className="resource-card-loading h-4 w-24 rounded-md mb-2 border-none shadow-none"></div>
                  <div className="resource-card-loading h-[46px] w-full rounded-xl border-none shadow-none"></div>
                </div>

                <div className="edit-profile-field">
                  <div className="resource-card-loading h-4 w-32 rounded-md mb-2 border-none shadow-none"></div>
                  <div className="resource-card-loading h-[46px] w-full rounded-xl border-none shadow-none"></div>
                </div>

                <div className="edit-profile-field">
                  <div className="resource-card-loading h-4 w-36 rounded-md mb-2 border-none shadow-none"></div>
                  <div className="resource-card-loading h-[46px] w-full rounded-xl border-none shadow-none"></div>
                </div>

                <div className="edit-profile-actions flex gap-4">
                  <div className="resource-card-loading h-11 w-full rounded-full border-none shadow-none"></div>
                  <div className="resource-card-loading h-11 w-full rounded-full border-none shadow-none"></div>
                </div>
                
                <div className="edit-profile-logout-wrap mt-6">
                  <div className="resource-card-loading h-[42px] w-[120px] rounded-full border-none shadow-none mx-auto"></div>
                </div>
              </div>
            </>
          ) : (
            <>
          <div className="edit-profile-header">
            <div className="profile-avatar-large edit-profile-avatar">
              {getInitials(formData.name || user?.name)}
            </div>
            <h1 className="edit-profile-title">Profile Settings</h1>
            <p className="edit-profile-subtitle">Manage your account.</p>
          </div>

          <div className="edit-profile-form">
            <div className="edit-profile-field">
              <label className="edit-profile-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="edit-profile-input"
                placeholder="Your Name"
              />
            </div>

            <div className="edit-profile-field">
              <label className="edit-profile-label">Google Account</label>
              <div className="edit-profile-input-wrap">
                <div className="edit-profile-icon">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="edit-profile-input has-icon"
                />
              </div>
            </div>

            <div className="edit-profile-field">
              <label className="edit-profile-label">Current Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="edit-profile-input edit-profile-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div className="edit-profile-actions">
              <button
                onClick={() => navigate('/profile')}
                className="edit-profile-btn edit-profile-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="edit-profile-btn edit-profile-btn-save"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
            <div className="edit-profile-logout-wrap">
              <button
                onClick={handleLogout}
                className="edit-profile-btn-logout"
              >
                <LogOut size={18} strokeWidth={2.5} />
                Log Out
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
