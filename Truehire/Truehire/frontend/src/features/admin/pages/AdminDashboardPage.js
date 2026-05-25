import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import apiService from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/_/g, '-');
const isAdminRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'super-admin';
};

const AdminDashboard = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!adminMenuRef.current) return;
      if (!adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setAdminMenuOpen(false);
      }
    };

    if (adminMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [adminMenuOpen]);

  // Tab data states
  const [usersData, setUsersData] = useState({ data: [], loading: false, error: null, pagination: null });
  const [recruitersData, setRecruitersData] = useState({ data: [], loading: false, error: null, pagination: null });
  const [recruiterApprovalsData, setRecruiterApprovalsData] = useState({ data: [], loading: false, error: null, pagination: null });
  const [jobsData, setJobsData] = useState({ data: [], loading: false, error: null, pagination: null });
  const [applicationsData, setApplicationsData] = useState({ data: [], loading: false, error: null, pagination: null });
  const [companiesData, setCompaniesData] = useState({ data: [], allData: [], loading: false, error: null });
  const [adminsData, setAdminsData] = useState({ data: [], loading: false, error: null, pagination: null });
  const [superAdminsData, setSuperAdminsData] = useState({ data: [], loading: false, error: null, pagination: null });

  // User management states
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: '',
    email_verified: '',
    registration_date_from: '',
    registration_date_to: '',
    registration_id: '',
    page: 1,
    limit: 10
  });
  const [userActionLoading, setUserActionLoading] = useState(null);

  // Recruiter management states
  const [recruiterFilters, setRecruiterFilters] = useState({
    search: '',
    type: '',
    status: '',
    verification: '',
    date_from: '',
    date_to: '',
    location: '',
    page: 1,
    limit: 10
  });

  // Recruiter approval states
  const [approvalFilters, setApprovalFilters] = useState({
    search: '',
    status: 'Pending Approval',
    page: 1,
    limit: 10
  });
  const [approvalActionLoading, setApprovalActionLoading] = useState(null);
  const [approvalRejectionReasons, setApprovalRejectionReasons] = useState({});

  // Job management states
  const [jobFilters, setJobFilters] = useState({
    keyword: '',
    company: '',
    location: '',
    status: '',
    posted_date_from: '',
    posted_date_to: '',
    page: 1,
    limit: 50
  });

  // Company management states
  const [companyFilters, setCompanyFilters] = useState({
    search: '',
    industry: 'All',
    size: 'All'
  });

  // Application management states
  const [applicationFilters, setApplicationFilters] = useState({
    status: '',
    applied_date_from: '',
    applied_date_to: '',
    page: 1,
    limit: 50
  });

  // Super Admin creation states
  const [superAdminForm, setSuperAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [superAdminFormMessage, setSuperAdminFormMessage] = useState({ type: '', text: '' });
  const [showSuperAdminPasswords, setShowSuperAdminPasswords] = useState(false);
  const [superAdminCreationLoading, setSuperAdminCreationLoading] = useState(false);
  const [currentSuperAdminCount, setCurrentSuperAdminCount] = useState(0);



  useEffect(() => {
    if (checkAuth() && (apiService.getToken() || apiService.getAdminToken())) {
      loadDashboardData();
    }
  }, []);

  const checkAuth = () => {
    const userData = apiService.getUserData();
    if (!userData || !isAdminRole(userData.role)) {
      apiService.clearToken();
      router.replace('/login');
      return false;
    }

    return true;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the dedicated dashboard stats endpoint
      const dashboardStats = await apiService.getAdminDashboardStats();

      setStats({
        stats: {
          totalUsers: dashboardStats.stats?.totalUsers || 0,
          totalRecruiters: dashboardStats.stats?.totalRecruiters || 0,
          totalJobs: dashboardStats.stats?.totalJobs || 0,
          totalApplications: dashboardStats.stats?.totalApplications || 0
        },
        recentUsers: dashboardStats.recentUsers || [],
        recentRecruiters: dashboardStats.recentRecruiters || [],
        recentJobs: []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (error.status === 401 || error.message?.includes('Access denied') || error.message?.includes('Invalid token')) {
        // Token is invalid, redirect to login
        apiService.clearToken();
        router.push('/login');
        return;
      }

      // Preserve functional UI without injecting synthetic demo identities.
      console.log('API failed, showing empty dashboard state');
      setStats({
        stats: {
          totalUsers: 0,
          totalRecruiters: 0,
          totalJobs: 0,
          totalApplications: 0
        },
        recentUsers: [],
        recentRecruiters: [],
        recentJobs: []
      });
      setError('Unable to load dashboard data right now.');
    } finally {
      setLoading(false);
    }
  };



  const filterCompanies = (companies, filters) => {
    const searchTerm = filters.search.trim().toLowerCase();
    const industryFilter = filters.industry || 'All';
    const sizeFilter = filters.size || 'All';

    return companies.filter((company) => {
      const name = company.company_name || company.company || '';
      const industry = company.industry || '';
      const size = company.company_size || '';
      const nameMatch = !searchTerm || name.toLowerCase().includes(searchTerm);
      const industryMatch = industryFilter === 'All' || industry === industryFilter;
      const sizeMatch = sizeFilter === 'All' || size === sizeFilter;
      return nameMatch && industryMatch && sizeMatch;
    });
  };

  const getCompanyLogoUrl = (logo) => {
    if (!logo || typeof logo !== 'string') return '';

    let normalized = logo.trim();
    if (!normalized || normalized === 'null' || normalized === 'undefined') return '';

    if (/^[a-zA-Z]:\\/.test(normalized)) return '';

    normalized = normalized.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalized)) return normalized;

    if (normalized.startsWith('uploads/')) {
      normalized = `/${normalized}`;
    } else if (normalized.startsWith('logos/')) {
      normalized = `/uploads/${normalized}`;
    } else if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }

    const base = apiService.getEffectiveBaseURL() || '';
    const hostFromBase = base.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    const hostFromOrigin = typeof window !== 'undefined'
      ? window.location.origin.replace(/\/+$/, '')
      : '';
    const host = hostFromBase || hostFromOrigin;

    if (!host) return normalized;
    return `${host}${normalized}`;
  };

  const getDocumentUrl = (filePath) => {
    if (!filePath || typeof filePath !== 'string') return '#';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const normalized = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const base = apiService.getEffectiveBaseURL() || '';
    const hostFromBase = base.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    const hostFromOrigin = typeof window !== 'undefined'
      ? window.location.origin.replace(/\/+$/, '')
      : '';
    const host = hostFromBase || hostFromOrigin;
    return host ? `${host}${normalized}` : normalized;
  };

  const getCompanyInitials = (name) => {
    if (!name) return 'CO';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || parts[0]?.[1] || '';
    return `${first}${second}`.toUpperCase() || 'CO';
  };

const fetchTabData = async (tab) => {
  console.log(`🔍 Fetching data for tab: ${tab}`);

  try {
    switch (tab) {
      case "users":
        setUsersData({ data: [], loading: true, error: null, pagination: null });

        const usersResponse = await apiService.getAllUsers(userFilters);
        console.log("📌 Users API Response:", usersResponse);
        console.log("➡️ Users Array:", usersResponse.users);
        console.log("➡️ Error:", usersResponse.error);
        console.log("➡️ Pagination:", usersResponse.pagination);

        setUsersData({
          data: usersResponse.users || [],
          loading: false,
          error: null,
          pagination: usersResponse.pagination
        });
        break;

      case "recruiters":
        setRecruitersData({ data: [], loading: true, error: null, pagination: null });

        const recruitersResponse = await apiService.getAllRecruiters(recruiterFilters);
        console.log("📌 Recruiters API Response:", recruitersResponse);
        const approvedRecruiters = (recruitersResponse.recruiters || []).filter((recruiter) => {
          const approval = String(recruiter?.approval_status || '').trim().toUpperCase();
          return approval === 'APPROVED';
        });

        setRecruitersData({
          data: approvedRecruiters,
          loading: false,
          error: null,
          pagination: recruitersResponse.pagination
        });
        break;

      case "recruiter_approvals":
        setRecruiterApprovalsData({ data: [], loading: true, error: null, pagination: null });

        const approvalsResponse = await apiService.getRecruiterApprovals(approvalFilters);
        console.log("dY“O Recruiter Approvals API Response:", approvalsResponse);

        setRecruiterApprovalsData({
          data: approvalsResponse.recruiters || [],
          loading: false,
          error: null,
          pagination: approvalsResponse.pagination
        });
        break;

      case "companies":
        setCompaniesData({ data: [], allData: [], loading: true, error: null });

        const companiesResponse = await apiService.request('/recruiters/companies', { useAdminToken: true });
        console.log("Companies API Response:", companiesResponse);

        const companyList = companiesResponse.companies || [];
        setCompaniesData({
          data: filterCompanies(companyList, companyFilters),
          allData: companyList,
          loading: false,
          error: null
        });
        break;

      case "jobs":
        setJobsData({ data: [], loading: true, error: null, pagination: null });

        const jobsResponse = await apiService.getAllJobs(jobFilters);
        console.log("📌 Jobs API Response:", jobsResponse);
        console.log("➡️ Jobs Array:", jobsResponse.jobs);
        console.log("➡️ Total jobs:", jobsResponse.jobs?.length);
        console.log("➡️ First job:", jobsResponse.jobs?.[0]);

        setJobsData({
          data: jobsResponse.jobs || [],
          loading: false,
          error: null,
          pagination: jobsResponse.pagination
        });
        break;

      case "applications":
        setApplicationsData({ data: [], loading: true, error: null, pagination: null });

        const applicationsResponse = await apiService.getAllApplications(applicationFilters);
        console.log("📌 Applications API Response:", applicationsResponse);

        setApplicationsData({
          data: applicationsResponse.applications || [],
          loading: false,
          error: null,
          pagination: applicationsResponse.pagination
        });
        break;

      case "admins":
        setAdminsData({ data: [], loading: true, error: null, pagination: null });

        const adminsResponse = await apiService.getAllAdmins({ limit: 50 });
        console.log("📌 Admins API Response:", adminsResponse);

        setAdminsData({
          data: adminsResponse.admins || [],
          loading: false,
          error: null,
          pagination: adminsResponse.pagination
        });
        break;

      case "super_admin":
        setSuperAdminsData({ data: [], loading: true, error: null, pagination: null });

        try {
          const superAdminsResponse = await apiService.getAllSuperAdmins({ limit: 50 });
          console.log("📌 Super Admins API Response:", superAdminsResponse);

          setSuperAdminsData({
            data: superAdminsResponse.superAdmins || [],
            loading: false,
            error: null,
            pagination: superAdminsResponse.pagination
          });

          const countResponse = await apiService.getSuperAdminCount();
          console.log("📌 Super Admin Count:", countResponse);

          setCurrentSuperAdminCount(countResponse.count || 0);
        } catch (err) {
          console.error("❌ Super Admin fetch ERROR:", err);

          setSuperAdminsData({
            data: [],
            loading: false,
            error: err.message,
            pagination: null
          });

          setCurrentSuperAdminCount(0);
        }
        break;

      default:
        console.warn(`⚠️ Unknown tab: ${tab}`);
        break;
    }
  } catch (error) {
    console.error(`❌ Error fetching ${tab} data:`, error);

    const errorMessage = error.message || `Failed to load ${tab} data`;

    switch (tab) {
      case "users":
        setUsersData({ data: [], loading: false, error: errorMessage, pagination: null });
        break;
      case "recruiters":
        setRecruitersData({ data: [], loading: false, error: errorMessage, pagination: null });
        break;
      case "recruiter_approvals":
        setRecruiterApprovalsData({ data: [], loading: false, error: errorMessage, pagination: null });
        break;
      case "companies":
        setCompaniesData({ data: [], allData: [], loading: false, error: errorMessage });
        break;
      case "jobs":
        setJobsData({ data: [], loading: false, error: errorMessage, pagination: null });
        break;
      case "applications":
        setApplicationsData({ data: [], loading: false, error: errorMessage, pagination: null });
        break;
      case "admins":
        setAdminsData({ data: [], loading: false, error: errorMessage, pagination: null });
        break;
      default:
        break;
    }
  }
};



  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      return;
    }

    if (!apiService.getToken()) {
      return;
    }

    fetchTabData(tab);
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete the job "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteJob(jobId);
      // Refresh the jobs data
      fetchTabData('jobs');
      alert('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUserActionLoading(userId);
      await apiService.deleteUser(userId);
      // Refresh the users data
      fetchTabData('users');
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteRecruiter = async (recruiterId, recruiterName) => {
    if (!window.confirm(`Are you sure you want to delete the recruiter "${recruiterName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUserActionLoading(recruiterId);
      await apiService.deleteRecruiter(recruiterId);
      // Refresh the recruiters data
      fetchTabData('recruiters');
      alert('Recruiter deleted successfully');
    } catch (error) {
      console.error('Error deleting recruiter:', error);
      alert('Failed to delete recruiter. Please try again.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleApproveRecruiter = async (recruiterId, recruiterName) => {
    if (!window.confirm(`Approve recruiter "${recruiterName}"? They will gain full access.`)) {
      return;
    }

    try {
      setApprovalActionLoading(recruiterId);
      await apiService.updateRecruiterApproval(recruiterId, 'Approved');
      fetchTabData('recruiter_approvals');
      alert('Recruiter approved successfully');
    } catch (error) {
      console.error('Error approving recruiter:', error);
      alert('Failed to approve recruiter. Please try again.');
    } finally {
      setApprovalActionLoading(null);
    }
  };

  const handleRejectRecruiter = async (recruiterId, recruiterName) => {
    const rejectionReason = String(approvalRejectionReasons[recruiterId] || '').trim();

    if (!rejectionReason) {
      alert('Please enter a rejection reason before rejecting.');
      return;
    }

    if (!window.confirm(`Reject recruiter "${recruiterName}"?`)) {
      return;
    }

    try {
      setApprovalActionLoading(recruiterId);
      await apiService.updateRecruiterApproval(recruiterId, 'Rejected', rejectionReason);
      setApprovalRejectionReasons(prev => ({ ...prev, [recruiterId]: '' }));
      fetchTabData('recruiter_approvals');
      alert('Recruiter rejected successfully');
    } catch (error) {
      console.error('Error rejecting recruiter:', error);
      alert('Failed to reject recruiter. Please try again.');
    } finally {
      setApprovalActionLoading(null);
    }
  };

  const handleDeleteSuperAdmin = async (superAdminId, superAdminName) => {
    if (!window.confirm(`Are you sure you want to delete the Super Admin "${superAdminName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUserActionLoading(superAdminId);
      const response = await apiService.deleteSuperAdmin(superAdminId);
      if (response && response.error) {
        alert(response.error || 'Failed to delete super admin.');
        return;
      }
      // Refresh the super admins data
      fetchTabData('super_admin');
      alert('Super Admin deleted successfully');
    } catch (error) {
      console.error('Error deleting super admin:', error);
      alert('Failed to delete super admin. Please try again.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();

    // Validate form
    if (!superAdminForm.name.trim() || !superAdminForm.email.trim() || !superAdminForm.password || !superAdminForm.confirmPassword) {
      setSuperAdminFormMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    if (superAdminForm.password !== superAdminForm.confirmPassword) {
      setSuperAdminFormMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (superAdminForm.password.length < 6) {
      setSuperAdminFormMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    // Check current count again
    if (currentSuperAdminCount >= 2) {
      setSuperAdminFormMessage({ type: 'error', text: 'Maximum number of Super Admin accounts reached.' });
      return;
    }

    try {
      setSuperAdminCreationLoading(true);
      setSuperAdminFormMessage({ type: '', text: '' });

      await apiService.createSuperAdmin({
        fullName: superAdminForm.name.trim(),
        email: superAdminForm.email.trim(),
        password: superAdminForm.password,
        confirmPassword: superAdminForm.confirmPassword
      });

      // Reset form
      setSuperAdminForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Update count
      setCurrentSuperAdminCount(prev => prev + 1);

      setSuperAdminFormMessage({ type: 'success', text: 'Super Admin created successfully. You can now login with those credentials.' });

      // Redirect to admin dashboard overview
      fetchTabData('super_admin');

    } catch (error) {
      console.error('Error creating super admin:', error);
      setSuperAdminFormMessage({ type: 'error', text: error.message || 'Failed to create Super Admin. Please try again.' });
    } finally {
      setSuperAdminCreationLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all state to prevent further API calls
    setStats(null);
    setUsersData({ data: [], loading: false, error: null, pagination: null });
    setRecruitersData({ data: [], loading: false, error: null, pagination: null });
    setJobsData({ data: [], loading: false, error: null, pagination: null });
    setApplicationsData({ data: [], loading: false, error: null, pagination: null });
    setCompaniesData({ data: [], allData: [], loading: false, error: null });
    setAdminsData({ data: [], loading: false, error: null, pagination: null });
    setError(null);
    router.replace('/').finally(() => {
      logout();
    });
  };

  const companyIndustryOptions = ['All', 'Finance', 'Healthcare', 'Retail', 'Education', 'Manufacturing', 'Technology', 'Consulting'];
  const companySizeOptions = [
    'All',
    ...Array.from(
      new Set((companiesData.allData || []).map((company) => company.company_size).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))
  ];
  const currentAdmin = apiService.getUserData();
  const currentAdminRole = normalizeRole(currentAdmin?.role);
  const adminDisplayName = currentAdmin?.name || currentAdmin?.email?.split('@')[0] || 'Admin';
  const roleLabel = currentAdminRole === 'super-admin' ? 'Super Admin' : 'Admin';
  const overviewStats = stats?.stats || {};
  const totalUsers = overviewStats.totalUsers || 0;
  const totalRecruiters = overviewStats.totalRecruiters || 0;
  const totalJobs = overviewStats.totalJobs || 0;
  const totalApplications = overviewStats.totalApplications || 0;
  const peopleReach = totalUsers + totalRecruiters;
  const totalTrackedEntities = peopleReach + totalJobs;
  const recruiterMix = totalUsers > 0
    ? `${totalRecruiters}:${totalUsers}`
    : `${totalRecruiters}:0`;
  const applicationDensity = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : '0.0';
  const lastUpdatedLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date());



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-100">Loading Dashboard</h2>
            <p className="text-slate-400 max-w-sm mx-auto">Preparing your admin workspace with the latest data and insights.</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div>
      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#100d0b]/70 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#dc2626)] shadow-[0_20px_30px_-18px_rgba(220,38,38,0.65)]">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">Admin Command Center</h1>
                <p className="text-sm text-slate-400">Oversight, moderation, approvals, and system control</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]" />
                Oversight Mode
              </div>
              <div ref={adminMenuRef} className="relative hidden sm:inline-flex">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.95)] transition-colors duration-200 hover:bg-white/10"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#b91c1c)] text-white text-xs font-semibold">
                    {adminDisplayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-left leading-tight">
                    <span className="block text-sm font-medium">{adminDisplayName}</span>
                    <span className="block text-xs text-slate-400">{roleLabel}</span>
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition ${adminMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#120f0d]/95 p-2 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)]">
                    <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">{roleLabel}</div>
                    <div
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => {
                        setAdminMenuOpen(false);
                        handleLogout();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setAdminMenuOpen(false);
                          handleLogout();
                        }
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-rose-500/10 hover:text-rose-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8 overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(140deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(30,64,175,0.78))] p-6 shadow-[0_35px_90px_-40px_rgba(0,0,0,0.95)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">Restricted Access</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Run platform oversight from a cleaner admin command center.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Review users, recruiters, jobs, approvals, and application health from a single workspace built for fast platform decisions.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => handleTabChange('recruiter_approvals')}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Review Approvals
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Manage Users
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
                <p className="mt-2 text-lg font-semibold text-white">{adminDisplayName}</p>
                <p className="text-sm text-slate-400">{roleLabel}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Focus area</p>
                <p className="mt-2 text-lg font-semibold text-white">Platform operations</p>
                <p className="text-sm text-slate-400">Users, recruiters, jobs, and applications</p>
              </div>
              <div className="rounded-[24px] border border-sky-300/15 bg-sky-300/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">System signal</p>
                <p className="mt-2 text-lg font-semibold text-white">Oversight active</p>
                <p className="text-sm text-sky-100/80">Admin controls are live and monitoring current platform state</p>
              </div>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 backdrop-blur-sm">
            <div className="text-rose-200 text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex flex-wrap gap-2 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(10,14,26,0.95))] p-3 shadow-[0_22px_50px_-28px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <button
              onClick={() => handleTabChange('overview')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                activeTab === 'overview'
                  ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h3a1 1 0 011 1v6H3a1 1 0 01-1-1v-5zm6-8a1 1 0 011-1h3a1 1 0 011 1v14H9a1 1 0 01-1-1V3zm6 4a1 1 0 011-1h3a1 1 0 011 1v10h-4V7z" />
                </svg>
                Overview
              </span>
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                activeTab === 'users'
                  ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Users ({stats?.stats?.totalUsers || 0})
              </span>
            </button>
            <button
              onClick={() => handleTabChange('recruiters')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                activeTab === 'recruiters'
                  ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h4a2 2 0 012 2v2H2V5zm0 4h8v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9zm10-4h4a2 2 0 012 2v2h-6V5zm0 4h6v6a2 2 0 01-2 2h-4V9z" />
                </svg>
                Recruiters ({stats?.stats?.totalRecruiters || 0})
              </span>
            </button>
            <button
              onClick={() => handleTabChange('recruiter_approvals')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                activeTab === 'recruiter_approvals'
                  ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 00-1 1v1H6a2 2 0 00-2 2v3h12V6a2 2 0 00-2-2h-2V3a1 1 0 00-1-1H9zm-5 9h12v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />
                </svg>
                Recruiter Approvals
              </span>
            </button>
            <button
              onClick={() => handleTabChange('companies')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                activeTab === 'companies'
                  ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.5a2 2 0 00-.586-1.414l-2.5-2.5A2 2 0 0013.5 3H4zm3 4h6v2H7V7zm0 4h8v2H7v-2z" />
                </svg>
                Companies
              </span>
            </button>
            <button
              onClick={() => handleTabChange('jobs')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                activeTab === 'jobs'
                  ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v4h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Jobs ({stats?.stats?.totalJobs || 0})
              </span>
            </button>
            <button
              onClick={() => handleTabChange('applications')}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                activeTab === 'applications'
                  ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a1 1 0 011-1h4a1 1 0 011 1v1h2a2 2 0 012 2v2H2V5a2 2 0 012-2h2V2zM2 9h16v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" />
                </svg>
                Applications
              </span>
            </button>
            {currentAdminRole === 'admin' && (
              <button
                onClick={() => handleTabChange('super_admin')}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                  activeTab === 'super_admin'
                    ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 016 6v3a4 4 0 11-8 0V8a2 2 0 10-4 0v3a6 6 0 006 6 6 6 0 006-6V8a6 6 0 00-6-6z" />
                  </svg>
                  Super Admin
                </span>
              </button>
            )}
            {currentAdminRole === 'super-admin' && (
              <button
                onClick={() => handleTabChange('admins')}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-transparent shadow-none transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
                  activeTab === 'admins'
                    ? 'text-slate-100 bg-slate-900/70 shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_6px_14px_rgba(2,6,23,0.45)]'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 10a3 3 0 100-6 3 3 0 000 6zm6 0a3 3 0 100-6 3 3 0 000 6zM3 18a4 4 0 014-4h2a4 4 0 014 4H3zm10 0a4 4 0 014-4h2a4 4 0 014 4h-6z" />
                  </svg>
                  Admins
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.98),rgba(8,12,23,0.98))] p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.95)] sm:p-8">
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-200/75">Overview</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">Platform Snapshot</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">A cleaner summary of platform scale, recruiter mix, jobs, and application flow.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                        Updated {lastUpdatedLabel}
                      </div>
                      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300">
                        Admin overview
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[26px] border border-sky-400/12 bg-sky-400/[0.04] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100/70">People Reach</p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">{peopleReach}</p>
                      <p className="mt-2 text-sm text-slate-400">Total user and recruiter accounts currently managed in the platform.</p>
                    </div>
                    <div className="rounded-[26px] border border-indigo-400/12 bg-indigo-400/[0.04] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-100/70">Recruiter Ratio</p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">{recruiterMix}</p>
                      <p className="mt-2 text-sm text-slate-400">Recruiters to users, shown as a direct ratio for faster reading.</p>
                    </div>
                    <div className="rounded-[26px] border border-emerald-400/12 bg-emerald-400/[0.04] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/70">Application Density</p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">{applicationDensity}</p>
                      <p className="mt-2 text-sm text-slate-400">Average applications received for each live job posting.</p>
                    </div>
                    <div className="rounded-[26px] border border-amber-400/12 bg-amber-400/[0.04] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">Applications Logged</p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">{totalApplications}</p>
                      <p className="mt-2 text-sm text-slate-400">Candidate activity tracked end to end across live jobs.</p>
                    </div>
                  </div>

                </div>

                <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,19,35,0.95),rgba(8,12,23,0.98))] p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.95)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Operational Focus</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      Live review
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[24px] border border-sky-400/12 bg-white/[0.03] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">User base</p>
                          <p className="mt-1 text-sm leading-6 text-slate-400">Track onboarding quality, account status, and recent signups.</p>
                        </div>
                        <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">{totalUsers} users</span>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-emerald-400/12 bg-white/[0.03] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Recruiter pipeline</p>
                          <p className="mt-1 text-sm leading-6 text-slate-400">Review approved recruiters and process pending organization access.</p>
                        </div>
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">{totalRecruiters} recruiters</span>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-amber-400/12 bg-white/[0.03] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Marketplace health</p>
                          <p className="mt-1 text-sm leading-6 text-slate-400">Monitor job inventory and application flow across the platform.</p>
                        </div>
                        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">{totalJobs} jobs</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Tracked Entities</p>
                        <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">{totalTrackedEntities}</p>
                        <p className="mt-2 text-sm text-slate-400">Combined users, recruiters, jobs, and applications currently under admin visibility.</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                        Live index
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Latest Activity</h2>
                <p className="text-sm text-slate-400">Recent signups and recruiter onboarding activity</p>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Users */}
              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(10,14,26,0.96))] shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-shadow duration-200 hover:shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
                <div className="border-b border-white/5 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-100">Recent Users</h3>
                    <span className="text-xs text-slate-400">Newest signups</span>
                  </div>
                </div>
                <div className="p-6">
                  {stats.recentUsers.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {stats.recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between rounded-2xl py-3 transition-colors duration-200 first:pt-0 last:pb-0 hover:bg-slate-800/40">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-slate-700 text-xs font-semibold text-white shadow-md shadow-indigo-500/20">
                              {user.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-100">{user.name}</p>
                              <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                            user.role === 'user' ? 'bg-blue-500/15 text-blue-200' : 'bg-emerald-500/15 text-emerald-200'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No recent users</p>
                  )}
                </div>
              </div>

              {/* Recent Recruiters */}
              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(10,14,26,0.96))] shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-shadow duration-200 hover:shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
                <div className="border-b border-white/5 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-100">Recent Recruiters</h3>
                    <span className="text-xs text-slate-400">Latest partners</span>
                  </div>
                </div>
                <div className="p-6">
                  {stats.recentRecruiters.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {stats.recentRecruiters.map((recruiter) => (
                        <div key={recruiter.id} className="flex items-center justify-between rounded-2xl py-3 transition-colors duration-200 first:pt-0 last:pb-0 hover:bg-slate-800/40">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-slate-700 text-xs font-semibold text-white shadow-md shadow-emerald-500/20">
                              {recruiter.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-100">{recruiter.name}</p>
                              <p className="text-sm text-slate-400">{recruiter.company}</p>
                            </div>
                          </div>
                          <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/15 text-emerald-200">
                            recruiter
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No recent recruiters</p>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">All Users</h3>
            </div>
            <div className="p-6">
              {/* Filters */}
              <div className="mb-6 bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Search</label>
                    <input
                      type="text"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Name or email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select
                      value={userFilters.status}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Registration Date From</label>
                    <input
                      type="date"
                      value={userFilters.registration_date_from}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, registration_date_from: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Registration Date To</label>
                    <input
                      type="date"
                      value={userFilters.registration_date_to}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, registration_date_to: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Registration ID</label>
                    <input
                      type="text"
                      value={userFilters.registration_id}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, registration_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search by registration number"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => fetchTabData('users')}
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(76,29,149,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setUserFilters({
                        search: '',
                        role: '',
                        status: '',
                        email_verified: '',
                        registration_date_from: '',
                        registration_date_to: '',
                        registration_id: '',
                        page: 1,
                        limit: 10
                      });
                      fetchTabData('users');
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-900/70 text-slate-200 ring-1 ring-slate-700/70 shadow-[inset_0_1px_0_rgba(148,163,184,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),_0_12px_24px_rgba(2,6,23,0.55)] active:translate-y-0"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              {usersData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : usersData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{usersData.error}</p>
                </div>
              ) : usersData.data.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-slate-950/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Registration Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/60 divide-y divide-white/5">
                      {usersData.data.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/60 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-100">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-300">{user.registration_number || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              user.status === 'Active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
                            }`}>
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              user.role === 'user' ? 'bg-indigo-500/15 text-indigo-200' : 'bg-emerald-500/15 text-emerald-200'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                disabled={userActionLoading === user.id}
                                className={`inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-lg bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/30 shadow-[inset_0_1px_0_rgba(248,113,113,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-rose-950/60 hover:shadow-[0_12px_24px_rgba(190,24,93,0.35)] ${
                                  userActionLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No users found</p>
              )}
            </div>
          </div>
        )}

        {/* Recruiters Tab */}
        {activeTab === 'recruiters' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">All Recruiters</h3>
            </div>
            <div className="p-6">
              {/* Filters */}
              <div className="mb-6 bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Search</label>
                    <input
                      type="text"
                      value={recruiterFilters.search}
                      onChange={(e) => setRecruiterFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Name, company, or email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select
                      value={recruiterFilters.status}
                      onChange={(e) => setRecruiterFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Verification</label>
                    <select
                      value={recruiterFilters.verification}
                      onChange={(e) => setRecruiterFilters(prev => ({ ...prev, verification: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All</option>
                      <option value="true">Verified</option>
                      <option value="false">Not Verified</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Registration Date From</label>
                    <input
                      type="date"
                      value={recruiterFilters.date_from}
                      onChange={(e) => setRecruiterFilters(prev => ({ ...prev, date_from: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Registration Date To</label>
                    <input
                      type="date"
                      value={recruiterFilters.date_to}
                      onChange={(e) => setRecruiterFilters(prev => ({ ...prev, date_to: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={recruiterFilters.location}
                      onChange={(e) => setRecruiterFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search by location"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => fetchTabData('recruiters')}
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(76,29,149,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setRecruiterFilters({
                        search: '',
                        type: '',
                        status: '',
                        verification: '',
                        date_from: '',
                        date_to: '',
                        location: '',
                        page: 1,
                        limit: 10
                      });
                      fetchTabData('recruiters');
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-900/70 text-slate-200 ring-1 ring-slate-700/70 shadow-[inset_0_1px_0_rgba(148,163,184,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),_0_12px_24px_rgba(2,6,23,0.55)] active:translate-y-0"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              {recruitersData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : recruitersData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{recruitersData.error}</p>
                </div>
              ) : recruitersData.data.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-slate-950/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/60 divide-y divide-white/5">
                      {recruitersData.data.map((recruiter) => (
                        <tr key={recruiter.id} className="hover:bg-slate-800/60 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-100">{recruiter.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">{recruiter.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-300">{recruiter.company}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              recruiter.status === 'Active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
                            }`}>
                              {recruiter.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/15 text-emerald-200">
                              recruiter
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {new Date(recruiter.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteRecruiter(recruiter.id, recruiter.name)}
                                disabled={userActionLoading === recruiter.id}
                                className={`inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-lg bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/30 shadow-[inset_0_1px_0_rgba(248,113,113,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-rose-950/60 hover:shadow-[0_12px_24px_rgba(190,24,93,0.35)] ${
                                  userActionLoading === recruiter.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No recruiters found</p>
              )}
            </div>
          </div>
        )}

        {/* Recruiter Approvals Tab */}
        {activeTab === 'recruiter_approvals' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">Recruiter Approvals</h3>
              <p className="text-sm text-slate-400 mt-1">Review recruiter registrations before full access is granted.</p>
            </div>
            <div className="p-6">
              <div className="mb-6 bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Search</label>
                    <input
                      type="text"
                      value={approvalFilters.search}
                      onChange={(e) => setApprovalFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Name, company, or email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Approval Status</label>
                    <select
                      value={approvalFilters.status}
                      onChange={(e) => setApprovalFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => fetchTabData('recruiter_approvals')}
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(76,29,149,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setApprovalFilters({ search: '', status: 'Pending Approval', page: 1, limit: 10 });
                      fetchTabData('recruiter_approvals');
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-900/70 text-slate-200 ring-1 ring-slate-700/70 shadow-[inset_0_1px_0_rgba(148,163,184,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),_0_12px_24px_rgba(2,6,23,0.55)] active:translate-y-0"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {recruiterApprovalsData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : recruiterApprovalsData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{recruiterApprovalsData.error}</p>
                </div>
              ) : recruiterApprovalsData.data.length > 0 ? (
                <div className="space-y-4">
                  {recruiterApprovalsData.data.map((recruiter) => {
                    const approvalStatus = recruiter.approval_status || 'Pending Approval';
                    const companyName = recruiter.company_name || recruiter.company || 'Not provided';
                    const officialEmail = recruiter.official_email || recruiter.email || 'Not provided';
                    const documents = recruiter.documents || [];

                    return (
                      <div key={recruiter.id} className="rounded-xl border border-white/5 bg-slate-900/60 p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-base font-semibold text-slate-100">{recruiter.name}</h4>
                              <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                approvalStatus === 'Approved'
                                  ? 'bg-emerald-500/15 text-emerald-200'
                                  : approvalStatus === 'Rejected'
                                    ? 'bg-rose-500/15 text-rose-200'
                                    : 'bg-amber-500/15 text-amber-200'
                              }`}>
                                {approvalStatus}
                              </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-400">
                              <div>
                                Official Email: <span className="text-slate-200">{officialEmail}</span>
                              </div>
                              <div>
                                Company: <span className="text-slate-200">{companyName}</span>
                              </div>
                              <div>
                                Registered: <span className="text-slate-200">{new Date(recruiter.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleApproveRecruiter(recruiter.id, recruiter.name)}
                              disabled={approvalActionLoading === recruiter.id}
                              className={`inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40 shadow-[0_10px_20px_rgba(16,185,129,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-emerald-500/30 ${
                                approvalActionLoading === recruiter.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRecruiter(recruiter.id, recruiter.name)}
                              disabled={approvalActionLoading === recruiter.id}
                              className={`inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-lg bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/30 shadow-[0_10px_20px_rgba(244,63,94,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-rose-950/60 ${
                                approvalActionLoading === recruiter.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                          <div className="rounded-lg border border-white/5 bg-slate-900/50 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Verification Documents</p>
                            {documents.length > 0 ? (
                              <div className="space-y-3">
                                {documents.map((doc) => (
                                  <div key={doc.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2">
                                    <div>
                                      <p className="text-sm font-medium text-slate-200">{doc.doc_type}</p>
                                      <a
                                        href={getDocumentUrl(doc.file_path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-indigo-300 hover:text-indigo-200"
                                      >
                                        View document
                                      </a>
                                      {doc.rejection_reason && (
                                        <p className="text-xs text-rose-200 mt-1">Reason: {doc.rejection_reason}</p>
                                      )}
                                    </div>
                                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                      doc.status === 'Verified'
                                        ? 'bg-emerald-500/15 text-emerald-200'
                                        : doc.status === 'Rejected'
                                          ? 'bg-rose-500/15 text-rose-200'
                                          : 'bg-amber-500/15 text-amber-200'
                                    }`}>
                                      {doc.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No documents uploaded.</p>
                            )}
                          </div>
                          <div className="rounded-lg border border-white/5 bg-slate-900/50 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Rejection Reason</p>
                            <textarea
                              rows={4}
                              value={approvalRejectionReasons[recruiter.id] || ''}
                              onChange={(e) => setApprovalRejectionReasons(prev => ({ ...prev, [recruiter.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                              placeholder="Provide a clear reason for rejection (required)."
                            />
                            <p className="text-xs text-slate-500 mt-2">Required for rejection.</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No recruiter approvals found</p>
              )}
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">All Companies</h3>
              <p className="text-sm text-slate-400 mt-1">Company profiles submitted by recruiters</p>
            </div>
            <div className="p-6">
              {/* Filters */}
              <div className="mb-6 bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Search</label>
                    <input
                      type="text"
                      value={companyFilters.search}
                      onChange={(e) => setCompanyFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Industry</label>
                    <select
                      value={companyFilters.industry}
                      onChange={(e) => setCompanyFilters(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {companyIndustryOptions.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Company Size</label>
                    <select
                      value={companyFilters.size}
                      onChange={(e) => setCompanyFilters(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {companySizeOptions.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setCompaniesData(prev => ({
                        ...prev,
                        data: filterCompanies(prev.allData || [], companyFilters)
                      }))}
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(76,29,149,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setCompanyFilters({ search: '', industry: 'All', size: 'All' });
                      setCompaniesData(prev => ({ ...prev, data: prev.allData || [] }));
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-900/70 text-slate-200 ring-1 ring-slate-700/70 shadow-[inset_0_1px_0_rgba(148,163,184,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),_0_12px_24px_rgba(2,6,23,0.55)] active:translate-y-0"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              {companiesData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : companiesData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{companiesData.error}</p>
                </div>
              ) : companiesData.data.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-slate-950/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Industry</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Website</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Overview</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/60 divide-y divide-white/5">
                      {companiesData.data.map((company) => {
                        const companyName = company.company_name || company.company || 'Company';
                        const initials = getCompanyInitials(companyName);
                        const logoUrl = getCompanyLogoUrl(company.company_logo);
                        return (
                          <tr key={company.id || company.recruiter_id || companyName} className="hover:bg-slate-800/60 transition-colors duration-200">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {logoUrl ? (
                                  <div className="relative h-9 w-9 shrink-0">
                                    <div className="h-9 w-9 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-semibold text-slate-200">
                                      {initials}
                                    </div>
                                    <img
                                      src={logoUrl}
                                      alt={companyName}
                                      className="absolute inset-0 h-9 w-9 rounded-lg object-cover border border-white/5 bg-slate-800"
                                      onLoad={(e) => {
                                        const fallback = e.currentTarget.previousElementSibling;
                                        if (fallback && fallback.style) {
                                          fallback.style.visibility = 'hidden';
                                        }
                                      }}
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.previousElementSibling;
                                        if (fallback && fallback.style) {
                                          fallback.style.visibility = 'visible';
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-9 w-9 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-semibold text-slate-200">
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-slate-100">{companyName}</p>
                                  <p className="text-xs text-slate-400">Recruiter ID: {company.recruiter_id || company.id || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">{company.industry || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{company.company_size || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">
                              {company.website ? (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-300 hover:text-indigo-200 underline"
                                >
                                  {company.website}
                                </a>
                              ) : (
                                'N/A'
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {company.short_overview || 'No overview provided'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No companies found</p>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">All Jobs</h3>
            </div>
            <div className="p-6">
              {/* Filters */}
              <div className="mb-6 bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Keyword Search</label>
                    <input
                      type="text"
                      value={jobFilters.keyword}
                      onChange={(e) => setJobFilters(prev => ({ ...prev, keyword: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Job title, description, or requirements"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                    <input
                      type="text"
                      value={jobFilters.company}
                      onChange={(e) => setJobFilters(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search by company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={jobFilters.location}
                      onChange={(e) => setJobFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Search by location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select
                      value={jobFilters.status}
                      onChange={(e) => setJobFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Draft">Draft</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Posted Date From</label>
                    <input
                      type="date"
                      value={jobFilters.posted_date_from}
                      onChange={(e) => setJobFilters(prev => ({ ...prev, posted_date_from: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Posted Date To</label>
                    <input
                      type="date"
                      value={jobFilters.posted_date_to}
                      onChange={(e) => setJobFilters(prev => ({ ...prev, posted_date_to: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => fetchTabData('jobs')}
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(76,29,149,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setJobFilters({
                        keyword: '',
                        company: '',
                        location: '',
                        status: '',
                        posted_date_from: '',
                        posted_date_to: '',
                        page: 1,
                        limit: 50
                      });
                      fetchTabData('jobs');
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-900/70 text-slate-200 ring-1 ring-slate-700/70 shadow-[inset_0_1px_0_rgba(148,163,184,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),_0_12px_24px_rgba(2,6,23,0.55)] active:translate-y-0"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              {jobsData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : jobsData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{jobsData.error}</p>
                </div>
              ) : jobsData.data.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-slate-950/60">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Posted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Applications</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/60 divide-y divide-white/5">
                      {jobsData.data.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-800/60 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-100">{job.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-400">{job.company_name || job.company || '—'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-300">{job.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              job.status === 'Active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {new Date(job.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                            <span className="font-medium">{job.application_count || 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteJob(job.id, job.title)}
                              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-lg bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/30 shadow-[inset_0_1px_0_rgba(248,113,113,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-rose-950/60 hover:shadow-[0_12px_24px_rgba(190,24,93,0.35)]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No jobs found</p>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">All Applications</h3>
            </div>
            <div className="p-6">
              {/* Filters */}
              <div className="mb-6 bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select
                      value={applicationFilters.status}
                      onChange={(e) => setApplicationFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Status</option>
                      <option value="Applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Applied Date From</label>
                    <input
                      type="date"
                      value={applicationFilters.applied_date_from}
                      onChange={(e) => setApplicationFilters(prev => ({ ...prev, applied_date_from: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Applied Date To</label>
                    <input
                      type="date"
                      value={applicationFilters.applied_date_to}
                      onChange={(e) => setApplicationFilters(prev => ({ ...prev, applied_date_to: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => fetchTabData('applications')}
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(76,29,149,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setApplicationFilters({
                        status: '',
                        applied_date_from: '',
                        applied_date_to: '',
                        page: 1,
                        limit: 50
                      });
                      fetchTabData('applications');
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-900/70 text-slate-200 ring-1 ring-slate-700/70 shadow-[inset_0_1px_0_rgba(148,163,184,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900/90 hover:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),_0_12px_24px_rgba(2,6,23,0.55)] active:translate-y-0"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              {applicationsData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : applicationsData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{applicationsData.error}</p>
                </div>
              ) : applicationsData.data.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-slate-950/60">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">App ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Job</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Recruiter</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Applied</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/60 divide-y divide-white/5">
                      {applicationsData.data.map((application) => (
                        <tr key={application.id} className="hover:bg-slate-800/60 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm text-slate-300">{application.id}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-100">{application.job_title}</p>
                            <p className="text-xs text-slate-400">{application.company}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-100">{application.user_name}</p>
                            <p className="text-xs text-slate-400">{application.user_email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">{application.recruiter_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {new Date(application.applied_at || application.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              application.status === 'pending' ? 'bg-amber-400/15 text-amber-200' :
                              application.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-200' :
                              application.status === 'rejected' ? 'bg-rose-500/15 text-rose-200' :
                              application.status === 'shortlisted' ? 'bg-indigo-500/15 text-indigo-200' :
                              'bg-slate-800 text-slate-200'
                            }`}>
                              {application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No applications found</p>
              )}
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">All Admins</h3>
            </div>
            <div className="p-6">
              {adminsData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : adminsData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{adminsData.error}</p>
                </div>
              ) : adminsData.data.length > 0 ? (
                <div className="space-y-3">
                  {adminsData.data.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between hover:bg-slate-800/60 p-4 rounded-xl transition-colors duration-200 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{admin.name}</p>
                        <p className="text-sm text-slate-400">{admin.email}</p>
                        <p className="text-xs text-slate-400">Joined: {new Date(admin.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                          admin.status === 'Active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
                        }`}>
                          {admin.status}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                          admin.role === 'admin' ? 'bg-indigo-500/15 text-indigo-200' : 'bg-indigo-500/15 text-indigo-200'
                        }`}>
                          {admin.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No admins found</p>
              )}
            </div>
          </div>
        )}

        {/* Super Admin Tab */}
        {activeTab === 'super_admin' && (
          <div className="bg-slate-900/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] border border-white/5">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">All Super Admins</h3>
              <p className="text-sm text-slate-300 mt-1">Manage Super Admin accounts (Maximum 2 allowed)</p>
            </div>
            <div className="p-6">
              {/* Current Count Info */}
              <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-indigo-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-indigo-200">Current Super Admin Count</p>
                    <p className="text-sm text-indigo-300">{currentSuperAdminCount} / 2</p>
                  </div>
                </div>
              </div>

              {/* Super Admins List */}
              {superAdminsData.loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              ) : superAdminsData.error ? (
                <div className="text-center py-8">
                  <p className="text-rose-300">{superAdminsData.error}</p>
                </div>
              ) : superAdminsData.data.length > 0 ? (
                <div className="space-y-3 mb-8">
                  {superAdminsData.data.map((superAdmin) => (
                    <div key={superAdmin.id} className="flex items-center justify-between hover:bg-slate-800/60 p-4 rounded-xl transition-colors duration-200 border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{superAdmin.name}</p>
                        <p className="text-sm text-slate-400">{superAdmin.email}</p>
                        <p className="text-xs text-slate-400">Joined: {new Date(superAdmin.created_at).toLocaleDateString()}</p>
                        {superAdmin.last_login && (
                          <p className="text-xs text-slate-400">Last Login: {new Date(superAdmin.last_login).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                          superAdmin.status === 'Active' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'
                        }`}>
                          {superAdmin.status || 'Active'}
                        </span>
                        <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-500/15 text-rose-200">
                          super_admin
                        </span>
                        <button
                          onClick={() => handleDeleteSuperAdmin(superAdmin.id, superAdmin.name)}
                          disabled={userActionLoading === superAdmin.id}
                          className={`inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium rounded-lg bg-rose-950/40 text-rose-200 ring-1 ring-rose-500/30 shadow-[inset_0_1px_0_rgba(248,113,113,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-rose-950/60 hover:shadow-[0_12px_24px_rgba(190,24,93,0.35)] ${
                            userActionLoading === superAdmin.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {userActionLoading === superAdmin.id ? (
                            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8 mb-8">No super admins found</p>
              )}

              {/* Create Super Admin Form */}
              {currentSuperAdminCount >= 2 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-rose-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-100 mb-2">Maximum Limit Reached</h3>
                  <p className="text-slate-300">You have reached the maximum number of Super Admin accounts (2).</p>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <h4 className="text-base font-semibold text-slate-100 mb-4">Create New Super Admin</h4>
                  <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
                    {superAdminFormMessage.text && (
                      <div className={`rounded-lg px-3 py-2 text-sm border ${
                        superAdminFormMessage.type === 'success'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                      }`}>
                        {superAdminFormMessage.text}
                      </div>
                    )}
                    <div>
                      <label htmlFor="superAdminName" className="block text-sm font-medium text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="superAdminName"
                        value={superAdminForm.name}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="superAdminEmail" className="block text-sm font-medium text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="superAdminEmail"
                        value={superAdminForm.email}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="superAdminPassword" className="block text-sm font-medium text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type={showSuperAdminPasswords ? "text" : "password"}
                        id="superAdminPassword"
                        value={superAdminForm.password}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter password (min 6 characters)"
                        required
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label htmlFor="superAdminConfirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type={showSuperAdminPasswords ? "text" : "password"}
                        id="superAdminConfirmPassword"
                        value={superAdminForm.confirmPassword}
                        onChange={(e) => setSuperAdminForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-700/70 rounded-md bg-slate-900/60 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Confirm password"
                        required
                        minLength={6}
                      />
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={showSuperAdminPasswords}
                        onChange={(e) => setShowSuperAdminPasswords(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>Show password</span>
                    </label>

                    <button
                      type="submit"
                      disabled={superAdminCreationLoading}
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500/90 via-violet-500/90 to-fuchsia-500/90 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(76,29,149,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {superAdminCreationLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Creating...
                        </div>
                      ) : (
                        'Create Super Admin'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

