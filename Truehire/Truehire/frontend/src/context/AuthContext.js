import { createContext, useContext, useEffect, useState } from 'react';
import apiService from '../lib/api';

const AuthContext = createContext();

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/_/g, '-');

const isAdminRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'super-admin';
};

const isRecruiterRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'recruiter' || normalizedRole === 'sub-recruiter';
};

const isUserRole = (role) => normalizeRole(role) === 'user';

const isAuthError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.status === 401 || message === 'invalid token.' || message.includes('jwt');
};

const isRoleMismatchError = (response) => {
  const message = String(
    response?.error ||
    response?.message ||
    response?.details?.message ||
    ''
  ).toLowerCase();

  return (
    message.includes('recruiter access required') ||
    message.includes('user access required') ||
    response?.status === 401 ||
    response?.status === 403
  );
};

const buildPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;

  const origin = (apiService?.baseURL || '').replace(/\/api$/, '').replace(/\/+$/, '');
  const withPrefix = (apiService?.baseURL || '').replace(/\/+$/, '');
  const normalizedPath = `${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;

  return origin
    ? `${origin}${normalizedPath}`
    : (withPrefix ? `${withPrefix}${normalizedPath}` : normalizedPath);
};

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object') return rawUser;

  const photo = rawUser.profile_photo || rawUser.profilePhoto || rawUser.photo || null;
  const photoUrl = buildPhotoUrl(photo);

  return {
    ...rawUser,
    profile_photo: photo || null,
    profilePhoto: photo || null,
    photoUrl: photoUrl || null,
  };
};

const fetchProfileForRole = async (role) => {
  if (isRecruiterRole(role)) {
    return apiService.getRecruiterProfile();
  }

  return apiService.getProfile();
};

const extractProfileUser = (profile, role) => {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  return isRecruiterRole(role) ? profile.recruiter : profile.user;
};

const mergeProfileWithStoredUser = (profileUser, storedUser) => {
  if (!profileUser) {
    return null;
  }

  return normalizeUser({
    ...profileUser,
    profile_photo: profileUser.profile_photo || storedUser?.profile_photo || storedUser?.profilePhoto,
    profilePhoto: profileUser.profilePhoto || storedUser?.profilePhoto || storedUser?.profile_photo,
  });
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminSession, setIsAdminSession] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const setLoggedOutState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsAdminSession(false);
  };

  const clearStoredAuth = () => {
    apiService.clearToken();
    if (typeof apiService.clearAdminToken === 'function') {
      apiService.clearAdminToken();
    }
  };

  const setAuthenticatedState = (nextUser) => {
    const normalizedUser = normalizeUser(nextUser);
    apiService.setUserData(normalizedUser);
    setUser(normalizedUser);
    setIsAuthenticated(true);
    setIsAdminSession(isAdminRole(normalizedUser?.role));
    return normalizedUser;
  };

  const checkAuthStatus = async () => {
    try {
      const token = apiService.getToken();
      const adminToken = apiService.getAdminToken();
      const storedUser = normalizeUser(apiService.getUserData());
      const storedRole = storedUser?.role;

      if (storedUser && isAdminRole(storedRole) && adminToken) {
        setUser(storedUser);
        setIsAuthenticated(true);
        setIsAdminSession(true);
        return;
      }

      if (!token) {
        if (adminToken) {
          clearStoredAuth();
        }
        setLoggedOutState();
        return;
      }

      try {
        const profile = await fetchProfileForRole(storedRole);

        if (profile && typeof profile === 'object' && profile.error) {
          console.error('Profile fetch failed:', profile.error, 'Status:', profile.status);

          if (profile.status >= 500) {
            console.warn('Server error during profile fetch, continuing without authentication');
            setLoggedOutState();
            return;
          }

          if (profile.status === 0 || profile.details?.isNetworkError) {
            console.warn('Network error during profile fetch, continuing without authentication');
            setLoggedOutState();
            return;
          }

          clearStoredAuth();
          setLoggedOutState();
          return;
        }

        const normalizedProfileUser = mergeProfileWithStoredUser(
          extractProfileUser(profile, storedRole),
          storedUser
        );

        if (!normalizedProfileUser) {
          throw new Error('Invalid profile response');
        }

        setAuthenticatedState(normalizedProfileUser);
      } catch (error) {
        console.error('Profile fetch error:', error);

        if (isAuthError(error)) {
          clearStoredAuth();
        } else {
          clearStoredAuth();
        }

        setLoggedOutState();
        console.warn('Authentication check failed, user logged out');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearStoredAuth();
      setLoggedOutState();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);

      if (!response?.user || !response?.token) {
        throw new Error('Invalid login response');
      }

      const normalizedLoginUser = normalizeUser(response.user);
      const adminUser = isAdminRole(normalizedLoginUser.role);

      apiService.setToken(response.token);
      if (adminUser) {
        apiService.setAdminToken(response.token);
      } else {
        apiService.clearAdminToken();
      }

      let finalUser = normalizedLoginUser;

      if (!adminUser) {
        try {
          const profile = await fetchProfileForRole(normalizedLoginUser.role);
          const profileUser = extractProfileUser(profile, normalizedLoginUser.role);
          const normalizedProfileUser = mergeProfileWithStoredUser(profileUser, normalizedLoginUser);

          if (normalizedProfileUser) {
            finalUser = normalizedProfileUser;
          }
        } catch (_error) {
          finalUser = normalizedLoginUser;
        }
      }

      const authenticatedUser = setAuthenticatedState(finalUser);
      return { ...response, user: authenticatedUser };
    } catch (error) {
      clearStoredAuth();
      setLoggedOutState();
      return { error: error.message };
    }
  };

  const register = async (userData, type = 'user') => {
    try {
      const response = type === 'recruiter'
        ? await apiService.registerRecruiter(userData)
        : await apiService.register(userData);

      if (response?.error) {
        return response;
      }

      if (!response?.user || !response?.token) {
        throw new Error('Invalid registration response');
      }

      const normalizedRegisteredUser = normalizeUser(response.user);
      apiService.setToken(response.token);
      apiService.clearAdminToken();

      let finalUser = normalizedRegisteredUser;

      try {
        const profile = await fetchProfileForRole(type === 'recruiter' ? 'recruiter' : 'user');
        const profileUser = extractProfileUser(profile, type === 'recruiter' ? 'recruiter' : 'user');
        const normalizedProfileUser = mergeProfileWithStoredUser(profileUser, normalizedRegisteredUser);

        if (normalizedProfileUser) {
          finalUser = normalizedProfileUser;
        }
      } catch (_error) {
        finalUser = normalizedRegisteredUser;
      }

      const authenticatedUser = setAuthenticatedState(finalUser);
      return { ...response, user: authenticatedUser };
    } catch (error) {
      console.warn('Registration error:', error?.message || error);
      return { error: error.message };
    }
  };

  const logout = () => {
    apiService.logout();
    setLoggedOutState();
  };

  const updateProfile = async (data) => {
    try {
      let updatedUser;
      const role = normalizeRole(user?.role);

      if (isUserRole(role)) {
        updatedUser = await apiService.updateProfile(data);
      } else if (isRecruiterRole(role)) {
        updatedUser = await apiService.updateCurrentRecruiterProfile(data);
      } else {
        updatedUser = await apiService.updateProfile(data);
        if (updatedUser?.error && isRoleMismatchError(updatedUser)) {
          updatedUser = await apiService.updateCurrentRecruiterProfile(data);
        }
      }

      if (updatedUser?.error && isRoleMismatchError(updatedUser)) {
        if (isUserRole(role)) {
          updatedUser = await apiService.updateCurrentRecruiterProfile(data);
        } else if (isRecruiterRole(role)) {
          updatedUser = await apiService.updateProfile(data);
        }
      }

      if (updatedUser?.error) {
        return updatedUser;
      }

      if (updatedUser?.user) {
        const normalizedUpdatedUser = normalizeUser(updatedUser.user);
        apiService.setUserData(normalizedUpdatedUser);
        setUser(normalizedUpdatedUser);
      }

      return updatedUser;
    } catch (error) {
      console.error('updateProfile final error:', error);
      return { error: error.message, status: error.status, details: error.details };
    }
  };

  const updateProfilePhoto = async (file) => {
    try {
      const updatedUser = await apiService.updateProfilePhoto(file);

      if (updatedUser?.error) {
        return updatedUser;
      }

      if (updatedUser?.user) {
        const normalizedUpdatedUser = normalizeUser(updatedUser.user);
        apiService.setUserData(normalizedUpdatedUser);
        setUser(normalizedUpdatedUser);
      }

      return updatedUser;
    } catch (error) {
      console.error('updateProfilePhoto error:', error);
      return { error: error.message, status: error.status, details: error.details };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdminSession,
    login,
    register,
    logout,
    updateProfile,
    updateProfilePhoto,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
