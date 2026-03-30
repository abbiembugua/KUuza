// In your VerifyEmail page/component
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }

    axios.get(`/api/accounts/verify-email/?token=${token}`)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/login'), 2500);
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'verifying') return <p>Verifying...</p>;
  if (status === 'success') return <p>✅ Email verified! Redirecting to login...</p>;
  return <p>❌ Invalid or expired link. <a href="/resend">Resend email</a></p>;
}