import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react';
import AuthCard from '../Components/shared/AuthCard';
import AuthPageShell from '../Components/shared/AuthPageShell';
import { verifyEmail } from '../api/authapi';
import { useTheme } from '../context/Themecontext';

export default function VerifyEmail() {
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing a token.');
      return;
    }

    verifyEmail(token)
      .then((result) => {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully.');
        setTimeout(() => navigate('/login'), 2500);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message || 'This verification link is invalid or expired.');
      });
  }, [navigate, searchParams]);

  const Icon = status === 'success' ? CheckCircle2 : status === 'error' ? XCircle : LoaderCircle;

  return (
    <AuthPageShell darkMode={darkMode} background="login">
      <div className="w-full max-w-md z-20">
        <AuthCard darkMode={darkMode} className="text-center">
          <div className="flex justify-center mb-4">
            <Icon
              size={42}
              className={
                status === 'success'
                  ? 'text-emerald-500'
                  : status === 'error'
                    ? 'text-red-500'
                    : 'text-sky-500 animate-spin'
              }
            />
          </div>

          <h1 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {status === 'success' ? 'Email verified' : status === 'error' ? 'Verification failed' : 'Verifying email'}
          </h1>

          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>

          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-medium text-white hover:bg-emerald-600"
            >
              Go to Login
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthPageShell>
  );
}
