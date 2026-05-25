// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import Head from 'next/head';
// import { useAuth } from '../../context/AuthContext';

// export default function AccountSettings() {
//   const { user, loading, updateUser } = useAuth();
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState('profile');
//   const [isLoading, setIsLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     email: '',
//     phone: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: '',
//     emailNotifications: true,
//     smsNotifications: false,
//     twoFactorAuth: false,
//   });
//   const [message, setMessage] = useState({ type: '', content: '' });

//   useEffect(() => {
//     if (!loading && !user) {
//       router.push('/login');
//       return;
//     }

//     if (user) {
//       setFormData(prevData => ({
//         ...prevData,
//         email: user.email || '',
//         phone: user.phone || '',
//         emailNotifications: user.preferences?.emailNotifications ?? true,
//         smsNotifications: user.preferences?.smsNotifications ?? false,
//         twoFactorAuth: user.preferences?.twoFactorAuth ?? false,
//       }));
//       setIsLoading(false);
//     }
//   }, [user, loading, router]);

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prevData => ({
//       ...prevData,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleProfileUpdate = async (e) => {
//     e.preventDefault();
//     try {
//       setMessage({ type: '', content: '' });
//       // Add your API call here to update profile information
//       setMessage({
//         type: 'success',
//         content: 'Profile updated successfully'
//       });
//     } catch (error) {
//       setMessage({
//         type: 'error',
//         content: error.message || 'Failed to update profile'
//       });
//     }
//   };

//   const handlePasswordChange = async (e) => {
//     e.preventDefault();
//     if (formData.newPassword !== formData.confirmPassword) {
//       setMessage({
//         type: 'error',
//         content: 'New passwords do not match'
//       });
//       return;
//     }
//     try {
//       setMessage({ type: '', content: '' });
//       // Add your API call here to change password
//       setMessage({
//         type: 'success',
//         content: 'Password changed successfully'
//       });
//     } catch (error) {
//       setMessage({
//         type: 'error',
//         content: error.message || 'Failed to change password'
//       });
//     }
//   };

//   const handlePreferencesUpdate = async (e) => {
//     e.preventDefault();
//     try {
//       setMessage({ type: '', content: '' });
//       // Add your API call here to update preferences
//       setMessage({
//         type: 'success',
//         content: 'Preferences updated successfully'
//       });
//     } catch (error) {
//       setMessage({
//         type: 'error',
//         content: error.message || 'Failed to update preferences'
//       });
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading settings...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Head>
//         <title>Account Settings - TrueHire</title>
//       </Head>
//       <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#1e3a8a]">
//         <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
//           <div className="mb-8">
//             <h1 className="text-4xl font-extrabold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//               Account Settings
//             </h1>
//           </div>

//           {message.content && (
//             <div className={`mb-6 p-4 rounded-lg ${
//               message.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
//             }`}>
//               {message.content}
//             </div>
//           )}

//           <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
//             <div className="flex flex-col md:flex-row">
//               {/* Sidebar */}
//               <div className="w-full md:w-64 bg-white/5">
//                 <nav className="p-6 space-y-2">
//                   <button
//                     onClick={() => setActiveTab('profile')}
//                     className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
//                       activeTab === 'profile'
//                         ? 'bg-blue-600 text-white'
//                         : 'text-gray-300 hover:bg-white/10'
//                     }`}
//                   >
//                     Profile Settings
//                   </button>
//                   <button
//                     onClick={() => setActiveTab('security')}
//                     className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
//                       activeTab === 'security'
//                         ? 'bg-blue-600 text-white'
//                         : 'text-gray-300 hover:bg-white/10'
//                     }`}
//                   >
//                     Security
//                   </button>
//                   <button
//                     onClick={() => setActiveTab('preferences')}
//                     className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
//                       activeTab === 'preferences'
//                         ? 'bg-blue-600 text-white'
//                         : 'text-gray-300 hover:bg-white/10'
//                     }`}
//                   >
//                     Preferences
//                   </button>
//                 </nav>
//               </div>

//               {/* Main Content */}
//               <div className="flex-1 p-8">
//                 {/* Profile Settings */}
//                 {activeTab === 'profile' && (
//                   <div>
//                     <div className="mb-8">
//                       <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
//                       <p className="text-gray-400">Manage your personal information and contact details</p>
//                     </div>
//                     <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
//                       <form onSubmit={handleProfileUpdate} className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                           <div className="space-y-6">
//                             <div>
//                               <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 Email Address
//                               </label>
//                               <div className="relative">
//                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                   <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                     <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
//                                     <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
//                                   </svg>
//                                 </div>
//                                 <input
//                                   type="email"
//                                   name="email"
//                                   value={formData.email}
//                                   onChange={handleInputChange}
//                                   className="w-full pl-10 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                   placeholder="your@email.com"
//                                 />
//                               </div>
//                             </div>
//                             <div>
//                               <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 Phone Number
//                               </label>
//                               <div className="relative">
//                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                   <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                     <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
//                                   </svg>
//                                 </div>
//                                 <input
//                                   type="tel"
//                                   name="phone"
//                                   value={formData.phone}
//                                   onChange={handleInputChange}
//                                   className="w-full pl-10 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                   placeholder="+1 (555) 000-0000"
//                                 />
//                               </div>
//                             </div>
//                           </div>
//                           <div className="space-y-6">
//                             <div className="bg-white/5 rounded-xl p-6 border border-white/10">
//                               <h3 className="text-lg font-medium text-white mb-4">Profile Visibility</h3>
//                               <div className="space-y-4">
//                                 <label className="flex items-center">
//                                   <input
//                                     type="radio"
//                                     name="visibility"
//                                     value="public"
//                                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//                                   />
//                                   <span className="ml-3 text-sm text-gray-300">Public Profile</span>
//                                 </label>
//                                 <label className="flex items-center">
//                                   <input
//                                     type="radio"
//                                     name="visibility"
//                                     value="private"
//                                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//                                   />
//                                   <span className="ml-3 text-sm text-gray-300">Private Profile</span>
//                                 </label>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex justify-end pt-6">
//                           <button
//                             type="submit"
//                             className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 flex items-center"
//                           >
//                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                             </svg>
//                             Save Changes
//                           </button>
//                         </div>
//                       </form>
//                     </div>
//                   </div>
//                 )}

//                 {/* Security Settings */}
//                 {activeTab === 'security' && (
//                   <div>
//                     <div className="mb-8">
//                       <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
//                       <p className="text-gray-400">Manage your password and security preferences</p>
//                     </div>
//                     <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
//                       <form onSubmit={handlePasswordChange} className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                           <div className="space-y-6">
//                             <div>
//                               <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 Current Password
//                               </label>
//                               <div className="relative">
//                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                   <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                     <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//                                   </svg>
//                                 </div>
//                                 <input
//                                   type="password"
//                                   name="currentPassword"
//                                   value={formData.currentPassword}
//                                   onChange={handleInputChange}
//                                   className="w-full pl-10 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                   placeholder="Enter current password"
//                                 />
//                               </div>
//                             </div>
//                             <div>
//                               <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 New Password
//                               </label>
//                               <div className="relative">
//                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                   <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                     <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//                                   </svg>
//                                 </div>
//                                 <input
//                                   type="password"
//                                   name="newPassword"
//                                   value={formData.newPassword}
//                                   onChange={handleInputChange}
//                                   className="w-full pl-10 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                   placeholder="Enter new password"
//                                 />
//                               </div>
//                             </div>
//                             <div>
//                               <label className="block text-sm font-medium text-gray-300 mb-2">
//                                 Confirm New Password
//                               </label>
//                               <div className="relative">
//                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                   <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                     <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
//                                   </svg>
//                                 </div>
//                                 <input
//                                   type="password"
//                                   name="confirmPassword"
//                                   value={formData.confirmPassword}
//                                   onChange={handleInputChange}
//                                   className="w-full pl-10 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                                   placeholder="Confirm new password"
//                                 />
//                               </div>
//                             </div>
//                           </div>
//                           <div className="space-y-6">
//                             <div className="bg-white/5 rounded-xl p-6 border border-white/10">
//                               <h3 className="text-lg font-medium text-white mb-4">Password Requirements</h3>
//                               <ul className="space-y-2 text-sm text-gray-400">
//                                 <li className="flex items-center">
//                                   <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                                   </svg>
//                                   At least 8 characters long
//                                 </li>
//                                 <li className="flex items-center">
//                                   <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                                   </svg>
//                                   Contains uppercase & lowercase letters
//                                 </li>
//                                 <li className="flex items-center">
//                                   <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//                                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                                   </svg>
//                                   Includes numbers & special characters
//                                 </li>
//                               </ul>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex justify-end pt-6">
//                           <button
//                             type="submit"
//                             className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 flex items-center"
//                           >
//                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
//                             </svg>
//                             Update Password
//                           </button>
//                         </div>
//                       </form>
//                     </div>
//                   </div>
//                 )}

//                 {/* Preferences */}
//                 {activeTab === 'preferences' && (
//                   <div>
//                     <div className="mb-8">
//                       <h2 className="text-2xl font-bold text-white mb-2">Preferences</h2>
//                       <p className="text-gray-400">Customize your notification and security preferences</p>
//                     </div>
//                     <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
//                       <form onSubmit={handlePreferencesUpdate} className="space-y-8">
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                           <div className="space-y-6">
//                             <div className="bg-white/5 rounded-xl p-6 border border-white/10">
//                               <h3 className="text-lg font-medium text-white mb-4">Notification Settings</h3>
//                               <div className="space-y-4">
//                                 <label className="flex items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
//                                   <input
//                                     type="checkbox"
//                                     name="emailNotifications"
//                                     checked={formData.emailNotifications}
//                                     onChange={handleInputChange}
//                                     className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//                                   />
//                                   <div className="ml-3">
//                                     <span className="text-sm font-medium text-white">Email Notifications</span>
//                                     <p className="text-xs text-gray-400 mt-1">Receive updates and alerts via email</p>
//                                   </div>
//                                 </label>
//                                 <label className="flex items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
//                                   <input
//                                     type="checkbox"
//                                     name="smsNotifications"
//                                     checked={formData.smsNotifications}
//                                     onChange={handleInputChange}
//                                     className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//                                   />
//                                   <div className="ml-3">
//                                     <span className="text-sm font-medium text-white">SMS Notifications</span>
//                                     <p className="text-xs text-gray-400 mt-1">Get important updates via text message</p>
//                                   </div>
//                                 </label>
//                               </div>
//                             </div>
//                           </div>
//                           <div className="space-y-6">
//                             <div className="bg-white/5 rounded-xl p-6 border border-white/10">
//                               <h3 className="text-lg font-medium text-white mb-4">Security Preferences</h3>
//                               <div className="space-y-4">
//                                 <label className="flex items-center p-3 hover:bg-white/5 rounded-lg transition-colors">
//                                   <input
//                                     type="checkbox"
//                                     name="twoFactorAuth"
//                                     checked={formData.twoFactorAuth}
//                                     onChange={handleInputChange}
//                                     className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//                                   />
//                                   <div className="ml-3">
//                                     <span className="text-sm font-medium text-white">Two-Factor Authentication</span>
//                                     <p className="text-xs text-gray-400 mt-1">Add an extra layer of security to your account</p>
//                                   </div>
//                                 </label>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex justify-end pt-6">
//                           <button
//                             type="submit"
//                             className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 flex items-center"
//                           >
//                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                             </svg>
//                             Save Preferences
//                           </button>
//                         </div>
//                       </form>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from '../../../context/AuthContext'

export default function AccountSettings() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    visibility: "public",
  });

  const [message, setMessage] = useState({ type: "", content: "" });

  // Load User Data
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        phone: user.phone || "",
        emailNotifications: user.preferences?.emailNotifications ?? true,
        smsNotifications: user.preferences?.smsNotifications ?? false,
        twoFactorAuth: user.preferences?.twoFactorAuth ?? false,
        visibility: user.visibility || "public",
      }));
      setIsLoading(false);
    }
  }, [user, loading, router]);

  // Generic input handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      setMessage({ type: "", content: "" });

      // Example update call
      await updateUser({
        email: formData.email,
        phone: formData.phone,
        visibility: formData.visibility,
      });

      setMessage({ type: "success", content: "Profile updated successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        content: err.message || "Failed to update profile",
      });
    }
  };

  // Password update
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", content: "New passwords do not match" });
      return;
    }

    try {
      setMessage({ type: "", content: "" });

      // Update password endpoint if exists
      console.log("Password Updated:", formData);

      setMessage({ type: "success", content: "Password changed successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        content: err.message || "Failed to change password",
      });
    }
  };

  // Preferences update
  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();

    try {
      setMessage({ type: "", content: "" });

      // Example API call
      await updateUser({
        preferences: {
          emailNotifications: formData.emailNotifications,
          smsNotifications: formData.smsNotifications,
          twoFactorAuth: formData.twoFactorAuth,
        },
      });

      setMessage({
        type: "success",
        content: "Preferences updated successfully",
      });
    } catch (err) {
      setMessage({
        type: "error",
        content: err.message || "Failed to update preferences",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Account Settings - TrueHire</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-[#1e3a8a]">
        <div className="max-w-7xl mx-auto px-4 py-8">

          <h1 className="text-4xl font-extrabold text-white mb-8">
            Account Settings
          </h1>

          {message.content && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-200"
                  : "bg-red-500/20 text-red-200"
              }`}
            >
              {message.content}
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="flex flex-col md:flex-row">

              {/* Sidebar */}
              <div className="w-full md:w-64 bg-white/5 p-6 space-y-2">
                {["profile", "security", "preferences"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-8">

                {/* Profile Settings */}
                {activeTab === "profile" && (
                  <form onSubmit={handleProfileUpdate} className="space-y-8 bg-white/5 p-6 rounded-xl border border-white/10">
                    <h2 className="text-2xl text-white mb-4">Profile Settings</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-gray-300">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-white/10 rounded-xl text-white"
                        />
                      </div>

                      <div>
                        <label className="text-gray-300">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-white/10 rounded-xl text-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <h3 className="text-white mb-2">Profile Visibility</h3>
                        <label className="text-gray-300 flex gap-2 items-center">
                          <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={formData.visibility === "public"}
                            onChange={handleInputChange}
                          />
                          Public
                        </label>

                        <label className="text-gray-300 flex gap-2 items-center">
                          <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={formData.visibility === "private"}
                            onChange={handleInputChange}
                          />
                          Private
                        </label>
                      </div>
                    </div>

                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl">
                      Save Changes
                    </button>
                  </form>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <form onSubmit={handlePasswordChange} className="space-y-8 bg-white/5 p-6 rounded-xl border border-white/10">
                    <h2 className="text-2xl text-white mb-4">Security Settings</h2>

                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Current Password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-white/10 rounded-xl text-white"
                    />

                    <input
                      type="password"
                      name="newPassword"
                      placeholder="New Password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-white/10 rounded-xl text-white"
                    />

                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-white/10 rounded-xl text-white"
                    />

                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl">
                      Update Password
                    </button>
                  </form>
                )}

                {/* Preferences */}
                {activeTab === "preferences" && (
                  <form onSubmit={handlePreferencesUpdate} className="space-y-8 bg-white/5 p-6 rounded-xl border border-white/10">
                    <h2 className="text-2xl text-white mb-4">Preferences</h2>

                    <label className="text-gray-300 flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleInputChange}
                      />
                      Email Notifications
                    </label>

                    <label className="text-gray-300 flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="smsNotifications"
                        checked={formData.smsNotifications}
                        onChange={handleInputChange}
                      />
                      SMS Notifications
                    </label>

                    <label className="text-gray-300 flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="twoFactorAuth"
                        checked={formData.twoFactorAuth}
                        onChange={handleInputChange}
                      />
                      Two-Factor Authentication
                    </label>

                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl">
                      Save Preferences
                    </button>
                  </form>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



