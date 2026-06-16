import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Rocket, ShieldCheck } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleSemesterSelect = async (semester: number) => {
    setSelectedSemester(semester);
    setError('');
    setLoading(true);

    try {
      // The backend route for updating profile is PATCH /api/users/me
      await axios.patch('/api/users/me', { semester });
      navigate('/home');
    } catch (err: any) {
      const apiErr = err.response?.data?.error;
      setError(typeof apiErr === 'string' ? apiErr : "Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white py-6 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="max-w-[500px] w-full bg-[#121214] p-8 rounded-2xl shadow-2xl border border-neutral-800/50 z-10 flex flex-col items-center">
        
        <div className="bg-[#1f1f22] p-4 rounded-full mb-6 flex items-center justify-center border border-neutral-800">
          <Rocket className="w-8 h-8 text-indigo-400" />
        </div>

        <h2 className="text-3xl font-bold text-white tracking-tight mb-2 text-center">
          Welcome to MitraShare!
        </h2>
        <p className="text-sm text-neutral-400 text-center mb-8 max-w-sm">
          Before we drop you into the vault, we need to tailor your experience. What semester are you currently in?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-8">
          {semesters.map((sem) => (
            <button
              key={sem}
              onClick={() => handleSemesterSelect(sem)}
              disabled={loading}
              className={`
                py-4 rounded-xl text-lg font-semibold transition-all duration-300 border
                ${selectedSemester === sem 
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                  : 'bg-[#1a1a1c] border-neutral-800 text-neutral-300 hover:bg-[#27272a] hover:border-neutral-700'
                }
                ${loading && selectedSemester !== sem ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Sem {sem}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm font-medium text-center mb-4">{error}</p>}

        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
            Configuring your vault...
          </div>
        )}

      </div>

      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
    </div>
  );
}
