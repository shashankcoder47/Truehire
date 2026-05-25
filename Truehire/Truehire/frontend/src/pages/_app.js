import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const PROTECTED_ROUTES = new Set([
  '/account',
  '/account-settings',
  '/active-jobs',
  '/admin-dashboard',
  '/admin/dashboard',
  '/ai-interview-coach',
  '/ai-profile-enhancer',
  '/ai-tools',
  '/anonymous-reviews',
  '/application-tracker',
  '/applications',
  '/billing-plans',
  '/candidate-profile',
  '/certifications',
  '/close-job',
  '/company-profile',
  '/connections',
  '/contact-candidate',
  '/dashboard',
  '/education',
  '/experience',
  '/inbox',
  '/insights',
  '/job-alerts',
  '/job-search',
  '/jobs-posted',
  '/languages',
  '/learning-hub',
  '/network',
  '/notifications',
  '/otp',
  '/overview',
  '/payment',
  '/post-job',
  '/premium-services',
  '/profile',
  '/profile-complete',
  '/recruiter-chats',
  '/recruiter-dashboard',
  '/recruiter/dashboard',
  '/recruiter-profile',
  '/recruiter-settings',
  '/saved-jobs',
  '/security',
  '/settings',
  '/setup-2fa',
  '/social-links',
  '/support',
  '/total-applications',
  '/user-dashboard',
  '/user/dashboard',
  '/user-profile-complete',
  '/verify-2fa',
  '/verify-account',
  '/voice-search',
  '/welcome',
]);

const PROTECTED_PREFIXES = [
  '/chat/',
  '/dashboard/',
  '/messages/',
  '/recruiter-applicant-profile/',
];

const ADMIN_ONLY_ROUTES = new Set([
  '/admin-dashboard',
  '/admin/dashboard',
]);

const USER_ONLY_ROUTES = new Set([
  '/user-dashboard',
  '/user/dashboard',
]);

const RECRUITER_ONLY_ROUTES = new Set([
  '/recruiter-dashboard',
  '/recruiter/dashboard',
]);

const isProtectedRoute = (pathname) => {
  if (!pathname) return false;
  if (PROTECTED_ROUTES.has(pathname)) return true;
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const normalizeRole = (role) =>
  String(role || '').trim().toLowerCase().replace(/_/g, '-');

const isAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'super-admin';
};

const isRecruiterRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'recruiter' || normalized === 'sub-recruiter';
};

const getDashboardPath = (role) => {
  const normalized = normalizeRole(role);
  if (isRecruiterRole(normalized)) return '/recruiter/dashboard';
  if (isAdminRole(normalized)) return '/admin/dashboard';
  return '/user/dashboard';
};

function AuthSessionGuard({ children }) {
  const router = useRouter();
  const { loading, user, isAdminSession } = useAuth();

  const hasSessionToken = Boolean(
    apiService.getToken() || apiService.getAdminToken()
  );

  const protectedRoute = isProtectedRoute(router.pathname);
  const adminOnlyRoute = ADMIN_ONLY_ROUTES.has(router.pathname);
  const recruiterOnlyRoute = RECRUITER_ONLY_ROUTES.has(router.pathname);
  const userOnlyRoute = USER_ONLY_ROUTES.has(router.pathname);

  const storedUser = apiService.getUserData();

  const hasAdminRole =
    isAdminSession ||
    isAdminRole(user?.role) ||
    isAdminRole(storedUser?.role);
  const currentRole = normalizeRole(user?.role || storedUser?.role || apiService.getRole());

  useEffect(() => {
    if (!router.isReady || loading || !protectedRoute) return;

    if (!hasSessionToken) {
      const next = encodeURIComponent(router.asPath || router.pathname || '/');
      router.replace(`/login?next=${next}`);
      return;
    }

    if (adminOnlyRoute && !hasAdminRole) {
      router.replace(getDashboardPath(currentRole));
      return;
    }

    if (recruiterOnlyRoute && !isRecruiterRole(currentRole)) {
      router.replace(getDashboardPath(currentRole));
      return;
    }

    if (userOnlyRoute && normalizeRole(currentRole) !== 'user') {
      router.replace(getDashboardPath(currentRole));
      return;
    }
  }, [
    adminOnlyRoute,
    currentRole,
    hasAdminRole,
    hasSessionToken,
    loading,
    protectedRoute,
    recruiterOnlyRoute,
    router,
    userOnlyRoute,
  ]);

  if (
    protectedRoute &&
    (
      loading ||
      !hasSessionToken ||
      (adminOnlyRoute && !hasAdminRole) ||
      (recruiterOnlyRoute && !isRecruiterRole(currentRole)) ||
      (userOnlyRoute && currentRole !== 'user')
    )
  ) {
    return null;
  }

  return children;
}

function MyApp({ Component, pageProps }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AuthSessionGuard>
          <Component {...pageProps} />
        </AuthSessionGuard>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;
