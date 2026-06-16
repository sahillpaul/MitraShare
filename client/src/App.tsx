import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Upload from './pages/Upload';
import Library from './pages/Library';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Only accessible if logged in) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          {/* We will add /upload, /library, and /profile inside here later! */}
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;