import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { UserPlus, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [academicProgram, setAcademicProgram] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.getAcademicPrograms().then(setPrograms).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Register with basic fields
      const data = await api.register({
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      // Step 2: Update extra profile fields + block account until admin activates
      await api.updateUser(data.jwt, data.user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender || null,
        birthDate: birthDate || null,
        mobileNumber: mobileNumber.trim() || null,
        academic_program: academicProgram || null,
        blocked: true,
      });

      // Don't auto-login — show success message
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-100 p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-900">Account Created!</h1>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Your account has been successfully created. Please contact the administrator to verify and activate your account before you can log in.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-100"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-sm";

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-zinc-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
              <UserPlus className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Create Account</h1>
            <p className="text-zinc-500 text-sm mt-1">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                    placeholder="Dela Cruz"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Birth Date</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className={inputClass}
                  placeholder="09XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Academic Program</label>
                <select
                  value={academicProgram}
                  onChange={(e) => setAcademicProgram(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select Academic Program</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.programCode}>
                      {p.programCode} - {p.programName || p.programDesc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4 pt-2 border-t border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pt-2">Account Information</h3>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder="juandelacruz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="juan@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-11`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pr-11`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
