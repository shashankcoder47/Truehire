import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext'

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Redirect based on user role and profile completion
  useEffect(() => {
    if (user.role === 'admin') {
      router.push('/admin-dashboard');
    } else if (user.role === 'recruiter') {
      router.push('/recruiter-dashboard');
    } else {
      // Check if user profile is complete
      if (user.profile_complete) {
        router.push('/overview');
      } else {
        router.push('/profile-complete');
      }
    }
  }, [user.role, user.profile_complete, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}



