
const RAW_API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').trim();

const NORMALIZED_BASE = RAW_API_BASE
  ? RAW_API_BASE.replace(/\/+$/, '')
  : '';

const API_BASE_URL = NORMALIZED_BASE.endsWith('/api')
  ? NORMALIZED_BASE
  : `${NORMALIZED_BASE}/api`;

const isLocalDevApiBase = (baseUrl) => {
  if (!baseUrl) return true;
  if (baseUrl.startsWith('/')) return true;

  try {
    const parsed = new URL(baseUrl);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const isAbsoluteUrl = (baseUrl) => /^https?:\/\//i.test(baseUrl || '');

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ---------------- STORAGE ----------------
  getSessionStorage() {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
  }

  getLocalStorage() {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  }

  getEffectiveBaseURL() {
    if (typeof window !== 'undefined' && isLocalDevApiBase(this.baseURL) && !isAbsoluteUrl(this.baseURL)) {
      return '/api';
    }
    return this.baseURL || '/api';
  }

  getDirectBaseURL() {
    return this.baseURL || '/api';
  }

  buildFallbackBase() {
    return '/api';
  }

  buildQueryString(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.set(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  // ---------------- TOKEN ----------------
  getToken() {
    return this.getSessionStorage()?.getItem('token') || this.getLocalStorage()?.getItem('token') || null;
  }

  setToken(token) {
    if (!token) return this.clearToken();

    this.getSessionStorage()?.setItem('token', token);
    this.getLocalStorage()?.setItem('token', token);
  }

  setRole(role) {
    const normalizedRole = String(role || '').trim().toLowerCase().replace(/_/g, '-');
    if (!normalizedRole) return this.clearRole();

    this.getSessionStorage()?.setItem('role', normalizedRole);
    this.getLocalStorage()?.setItem('role', normalizedRole);
  }

  getRole() {
    return this.getSessionStorage()?.getItem('role') || this.getLocalStorage()?.getItem('role') || null;
  }

  clearRole() {
    this.getSessionStorage()?.removeItem('role');
    this.getLocalStorage()?.removeItem('role');
  }

  getAdminToken() {
    return this.getSessionStorage()?.getItem('adminToken') || this.getLocalStorage()?.getItem('adminToken') || null;
  }

  setAdminToken(token) {
    if (!token) return this.clearAdminToken();

    this.getSessionStorage()?.setItem('adminToken', token);
    this.getLocalStorage()?.setItem('adminToken', token);
  }

  clearAdminToken() {
    this.getSessionStorage()?.removeItem('adminToken');
    this.getLocalStorage()?.removeItem('adminToken');
  }

  clearToken() {
    for (const storage of [this.getSessionStorage(), this.getLocalStorage()]) {
      storage?.removeItem('token');
      storage?.removeItem('adminToken');
      storage?.removeItem('user');
      storage?.removeItem('role');
      storage?.removeItem('isLoggedIn');
      storage?.removeItem('recruiterLoggedIn');
      storage?.removeItem('recruiterData');
      storage?.removeItem('recruiterOtpVerified');
      storage?.removeItem('pendingOtpEmail');
      storage?.removeItem('pendingOtpPassword');
      storage?.removeItem('pendingRecruiterNext');
    }
    this.clearAdminToken();
  }

  // ---------------- USER ----------------
  setUserData(user) {
    const serializedUser = JSON.stringify(user);
    const normalizedRole = String(user?.role || '').trim().toLowerCase().replace(/_/g, '-');

    this.getSessionStorage()?.setItem('user', serializedUser);
    this.getLocalStorage()?.setItem('user', serializedUser);

    for (const storage of [this.getSessionStorage(), this.getLocalStorage()]) {
      if (!storage) continue;
      if (normalizedRole === 'recruiter' || normalizedRole === 'sub-recruiter') {
        storage.setItem('recruiterLoggedIn', 'true');
        storage.setItem('recruiterData', serializedUser);
        storage.removeItem('isLoggedIn');
      } else if (normalizedRole === 'user') {
        storage.setItem('isLoggedIn', 'true');
        storage.removeItem('recruiterLoggedIn');
        storage.removeItem('recruiterData');
      }
    }

    this.setRole(user?.role);
  }

  getUserData() {
    const data = this.getSessionStorage()?.getItem('user') || this.getLocalStorage()?.getItem('user');

    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ---------------- REQUEST ----------------
  getAuthHeaders(isFormData = false) {
    const headers = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken() || this.getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    return headers;
  }

  normalizeEndpoint(endpoint) {
    if (!endpoint) return endpoint;

    let ep = endpoint.trim();

    if (ep.startsWith('/api/')) {
      ep = ep.replace(/^\/api/, '');
    }

    if (!ep.startsWith('/')) ep = `/${ep}`;

    return ep;
  }

  async request(endpoint, options = {}) {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const isFormDataBody = options.body instanceof FormData;
    const baseUrl =
      typeof window !== 'undefined' && isFormDataBody
        ? this.getDirectBaseURL()
        : this.getEffectiveBaseURL();
    const url = `${baseUrl}${normalizedEndpoint}`;

    const headers = {
      ...this.getAuthHeaders(isFormDataBody),
      ...(options.headers || {}),
    };

    const method = options.method || 'GET';
    const config = {
      ...options,
      headers,
      method,
    };

    if (['GET', 'HEAD'].includes(method.toUpperCase()) && config.cache === undefined) {
      config.cache = 'no-store';
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (error) {
      const networkError = new Error(
        isLocalDevApiBase(this.baseURL)
          ? 'Backend server is not reachable. Please try again after the API server starts.'
          : 'Network error. Please check your connection and try again.'
      );
      networkError.cause = error;
      throw networkError;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `HTTP ${response.status}`;

      if (options.returnErrorObject) {
        return {
          error: errorMessage,
          message: errorMessage,
          status: response.status,
          details: data,
        };
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  }

  // ---------------- AUTH ----------------
  async login(credentials) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(res.token);
    this.setUserData(res.user);
    this.setRole(res.role || res.user?.role);

    return res;
  }

  async adminLogin(credentials) {
    const res = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(res.token);
    this.setAdminToken(res.token);
    this.setUserData(res.user);
    this.setRole(res.role || res.user?.role);

    return res;
  }

  async sendOTP(email, password) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      returnErrorObject: true,
    });
  }

  async verifyOTP(payload) {
    const res = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
      returnErrorObject: true,
    });

    if (res?.token) {
      this.setToken(res.token);
    }

    if (res?.user) {
      this.setUserData(res.user);
    }

    return res;
  }

  async logout() {
    this.clearToken();
  }

  async register(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...userData, role: 'USER' }),
    });
    this.setToken(res.token);
    this.setUserData(res.user);
    this.setRole(res.role || res.user?.role);
    return res;
  }

  async registerRecruiter(userData) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...userData, role: 'RECRUITER' }),
      returnErrorObject: true,
    });
    if (res?.token) this.setToken(res.token);
    if (res?.user) this.setUserData(res.user);
    this.setRole(res?.role || res?.user?.role);
    return res;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ---------------- PROFILE ----------------
  async getProfile() {
    return this.request('/users/profile/me');
  }

  async getPublicUserProfile(userId) {
    return this.request(`/users/profile/${userId}`);
  }

  async getRecruiterProfile() {
    return this.request('/recruiters/profile/me');
  }

  async getAdminDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getAllUsers(params = {}) {
    return this.request(`/admin/users${this.buildQueryString(params)}`);
  }

  async getAllRecruiters(params = {}) {
    return this.request(`/admin/recruiters${this.buildQueryString(params)}`);
  }

  async getRecruiterApprovals(params = {}) {
    return this.request(`/admin/recruiter-approvals${this.buildQueryString(params)}`);
  }

  async getAllJobs(params = {}) {
    return this.request(`/admin/jobs${this.buildQueryString(params)}`);
  }

  async getAllApplications(params = {}) {
    return this.request(`/admin/applications${this.buildQueryString(params)}`);
  }

  async getAllAdmins(params = {}) {
    return this.request(`/admin/admins${this.buildQueryString(params)}`);
  }

  async getAllSuperAdmins(params = {}) {
    return this.request(`/admin/super-admins${this.buildQueryString(params)}`);
  }

  async getSuperAdminCount() {
    return this.request('/admin/super-admin-count');
  }

  async createSuperAdmin(data) {
    return this.request('/admin/create-super-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteJob(jobId) {
    return this.request(`/admin/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async deleteRecruiter(recruiterId) {
    return this.request(`/admin/recruiters/${recruiterId}`, {
      method: 'DELETE',
    });
  }

  async updateRecruiterApproval(recruiterId, status, reason = null) {
    return this.request(`/admin/recruiters/${recruiterId}/approval`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        ...(reason ? { reason } : {}),
      }),
    });
  }

  async deleteSuperAdmin(superAdminId) {
    return this.request(`/admin/super-admins/${superAdminId}`, {
      method: 'DELETE',
    });
  }

  async updateProfile(data) {
    return this.request('/users/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getFriendSuggestions(limit = 10) {
    return this.request(`/users/friend-suggestions${this.buildQueryString({ limit })}`);
  }

  async sendFriendRequest(receiverId) {
    return this.request(`/friends/request/${receiverId}`, {
      method: 'POST',
    });
  }

  async getPendingConnectionRequests() {
    return this.request('/connections/pending');
  }

  async getMyConnections() {
    return this.request('/connections/my');
  }

  async sendConnectionRequest(receiverId) {
    return this.request('/connections/send', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId }),
    });
  }

  async acceptConnectionRequest(requestId) {
    return this.request(`/connections/accept/${requestId}`, {
      method: 'POST',
    });
  }

  async rejectConnectionRequest(requestId) {
    return this.request(`/connections/reject/${requestId}`, {
      method: 'POST',
    });
  }

  async getConnectionStatus(userId) {
    return this.request(`/connections/status/${userId}`);
  }

  async getConnectionStats() {
    return this.request('/follows/stats');
  }

  async getFollowList(type) {
    return this.request(`/follows/${type}`);
  }

  async followUser(userId) {
    return this.request(`/follows/${userId}`, { method: 'POST' });
  }

  async getUserFollowStatus(userId) {
    return this.request(`/follows/status/${userId}`);
  }

  async updateCurrentRecruiterProfile(data) {
    return this.request('/recruiters/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getRecruiterVerification() {
    return this.request('/recruiters/verification', {
      returnErrorObject: true,
    });
  }

  async uploadRecruiterVerificationDoc(formData) {
    return this.request('/recruiters/verification', {
      method: 'POST',
      body: formData,
      returnErrorObject: true,
    });
  }

  async getRecruiterNotifications() {
    return this.request('/recruiters/notifications', {
      returnErrorObject: true,
    });
  }

  async markRecruiterNotificationRead(notificationId) {
    return this.request(`/recruiters/notifications/${notificationId}/read`, {
      method: 'PATCH',
      returnErrorObject: true,
    });
  }

  async sendRecruiterPhoneOtp(phone) {
    return this.request('/recruiters/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      returnErrorObject: true,
    });
  }

  async verifyRecruiterPhoneOtp(phone, otp) {
    return this.request('/recruiters/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
      returnErrorObject: true,
    });
  }

  async recruiterForgotPassword(email) {
    return this.request('/auth/recruiter-forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      returnErrorObject: true,
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      returnErrorObject: true,
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
      returnErrorObject: true,
    });
  }

  async shortlistApplication(applicationId) {
    return this.request(`/recruiters/applications/${applicationId}/shortlist`, {
      method: 'PUT',
      returnErrorObject: true,
    });
  }

  async updateProfilePhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    return this.request('/users/profile/photo', {
      method: 'PUT',
      body: formData,
    });
  }

  async uploadCertificationDocument(file) {
    const formData = new FormData();
    formData.append('document', file);

    return this.request('/users/profile/certification-document', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadProfileResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    return this.request('/users/profile/resume', {
      method: 'POST',
      body: formData,
    });
  }

  async followCompany(companyId) {
    return this.request(`/companies/${companyId}/follow`, {
      method: 'POST',
      returnErrorObject: true,
    });
  }

  async unfollowCompany(companyId) {
    return this.request(`/companies/${companyId}/unfollow`, {
      method: 'DELETE',
      returnErrorObject: true,
    });
  }

  async getCompanyFollowStatus(companyId) {
    return this.request(`/companies/${companyId}/follow-status`, {
      returnErrorObject: true,
    });
  }

  async getFollowedCompanies() {
    return this.request('/users/followed-companies', {
      returnErrorObject: true,
    });
  }

  async getCompanyMessageAccessStatus(companyId) {
    return this.request(`/payments/company-message/status/${companyId}`, {
      returnErrorObject: true,
    });
  }

  async createCompanyMessageOrder(companyId) {
    return this.request('/payments/company-message/create-order', {
      method: 'POST',
      body: JSON.stringify({ companyId }),
      returnErrorObject: true,
    });
  }

  async verifyCompanyMessagePayment(payload) {
    return this.request('/payments/company-message/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
      returnErrorObject: true,
    });
  }

  async openCompanyMessageConversation(companyId) {
    return this.request(`/messages/company/${companyId}/conversation`, {
      method: 'POST',
      returnErrorObject: true,
    });
  }
}

const apiService = new ApiService();
export { apiService };
export default apiService;
