import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const { user, token, getProfile } = useAuth();
  const navigate = useNavigate();

  // Attempt silent re-authentication if token exists but user profile is missing
  useEffect(() => {
    if (token && !user) {
      getProfile()
        .then((profile) => {
          if (profile) {
            navigate(profile.role === 'SHIPPER' ? '/shipper' : '/driver');
          }
        })
        .catch(() => {
          // Stay on 404 if profile fetch fails
        });
    }
  }, [token, user, getProfile, navigate]);

  const handleReturn = () => {
    if (user) {
      navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 px-6 font-body text-slate-600">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Large SVG Illustration */}
        <div className="flex justify-center text-slate-300">
          <div className="p-6 bg-white rounded-full shadow-sm border border-slate-200">
            <AlertTriangle size={64} className="text-slate-400" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight font-heading leading-tight">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            The page you are looking for does not exist, has been removed, or requires authentication.
          </p>
        </div>

        {/* Primary and Secondary CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto pt-2">
          <PrimaryButton
            onClick={handleReturn}
            fullWidth
            className="py-3 text-xs"
          >
            Return to Dashboard
          </PrimaryButton>
          <PrimaryButton
            onClick={() => navigate('/')}
            variant="outline"
            fullWidth
            className="py-3 text-xs"
          >
            Go Home
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
