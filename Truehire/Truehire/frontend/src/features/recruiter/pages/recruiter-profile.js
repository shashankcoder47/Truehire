// // // ---------------------------------------------
// // Recruiter Profile Page (Fully Fixed & Working)
// // ---------------------------------------------

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/router";
// import Head from "next/head";
// import Header from "../Header";
// import Footer from "../Footer";

// // ------------------------------------------------
// // Toast Component
// // ------------------------------------------------
// const Toast = ({ message, type, onClose }) => {
//   useEffect(() => {
//     const t = setTimeout(() => onClose(), 4000);
//     return () => clearTimeout(t);
//   }, []);

//   return (
//     <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg text-white 
//       ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
//       <div className="flex items-center">
//         <span className="flex-1">{message}</span>
//         <button className="ml-3 font-bold text-xl" onClick={onClose}>
//           ×
//         </button>
//       </div>
//     </div>
//   );
// };

// // ------------------------------------------------
// // Main Page
// // ------------------------------------------------
// export default function RecruiterProfile() {
//   const router = useRouter();

//   const [recruiterData, setRecruiterData] = useState(null);
//   const [formData, setFormData] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [activeTab, setActiveTab] = useState("personal");
//   const [logoPreview, setLogoPreview] = useState(null);
//   const [toast, setToast] = useState(null);

//   const showToast = (message, type = "success") =>
//     setToast({ message, type });

//   const hideToast = () => setToast(null);

//   // -----------------------------------------------
//   // Load Profile
//   // -----------------------------------------------
//   useEffect(() => {
//     const loadProfile = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const userLS = localStorage.getItem("user");

//         if (!token || !userLS) {
//           router.push("/login");
//           return;
//         }

//         const response = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/recruiters/profile/me`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         if (response.ok) {
//           const data = await response.json();
//           setRecruiterData(data.recruiter);
//           setFormData(data.recruiter);
//         } else {
//           const fallback = JSON.parse(userLS);
//           setRecruiterData(fallback);
//           setFormData(fallback);
//         }
//       } catch {
//         router.push("/login");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadProfile();
//   }, []);

//   // -----------------------------------------------
//   // Input Change
//   // -----------------------------------------------
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((p) => ({ ...p, [name]: value }));
//   };

//   // -----------------------------------------------
//   // Logo Upload
//   // -----------------------------------------------
//   const handleLogoChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Preview
//     const reader = new FileReader();
//     reader.onload = (ev) => {
//       setLogoPreview(ev.target.result);
//       setFormData((p) => ({ ...p, company_logo: ev.target.result }));
//     };
//     reader.readAsDataURL(file);

//     // Upload
//     const token = localStorage.getItem("token");
//     const fd = new FormData();
//     fd.append("logo", file);

//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/recruiters/profile/logo`,
//         {
//           method: "POST",
//           headers: { Authorization: `Bearer ${token}` },
//           body: fd,
//         }
//       );

//       const data = await res.json();
//       if (res.ok) {
//         setFormData((p) => ({ ...p, company_logo: data.logoUrl }));
//       }
//     } catch {}
//   };

//   // -----------------------------------------------
//   // FIXED: Save Profile
//   // -----------------------------------------------
//   const handleSave = async () => {
//     setSaving(true);

//     try {
//       const token = localStorage.getItem("token");

//       // Remove fields backend blocks
//       const { email, password, ...safeData } = formData;

//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/recruiters/profile/me`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(safeData),
//         }
//       );

//       const data = await res.json();

//       if (res.ok) {
//         setRecruiterData(data.recruiter);
//         setFormData(data.recruiter);
//         setIsEditing(false);
//         setLogoPreview(null);
//         showToast("Profile updated successfully");
//       } else {
//         showToast(data.message || "Update failed", "error");
//       }
//     } catch {
//       showToast("Something went wrong", "error");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleCancel = () => {
//     setFormData(recruiterData);
//     setIsEditing(false);
//     setLogoPreview(null);
//   };

//   // -----------------------------------------------
//   // FIXED: Accurate Profile Completion (7 required fields)
//   // -----------------------------------------------
//   const calculateProfileCompletion = () => {
//     if (!formData) return 0;

//     const required = [
//       "name",
//       "role",
//       "company_name",
//       "industry",
//       "company_size",
//       "short_overview",
//       "email", // email is always filled since backend stores it
//     ];

//     let filled = 0;
//     required.forEach((f) => {
//       const v = formData[f];
//       if (v && v.toString().trim() !== "") filled++;
//     });

//     return Math.round((filled / required.length) * 100);
//   };

//   const formatDate = (d) =>
//     d
//       ? new Date(d).toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         })
//       : "Not updated";

//   // -----------------------------------------------
//   // Loading State
//   // -----------------------------------------------
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-gray-700">
//         <div>
//           <div className="animate-spin w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
//           <p className="mt-3 text-center">Loading profile…</p>
//         </div>
//       </div>
//     );
//   }

//   // -----------------------------------------------
//   // MAIN UI
//   // -----------------------------------------------
//   return (
//     <>
//       <Head>
//         <title>Recruiter Profile</title>
//       </Head>

//       <Header />

//       <main className="min-h-screen bg-gray-50 pt-20 px-6">
//         <div className="max-w-6xl mx-auto">

//           {/* HEADER */}
//           <div className="bg-white p-6 rounded shadow mb-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h1 className="text-2xl font-bold">Recruiter Profile</h1>
//                 <p className="text-gray-600">Manage your information</p>
//               </div>

//               <div className="flex items-center gap-4">
//                 <div className="text-right">
//                   <p className="text-sm text-gray-500">Completion</p>
//                   <p className="text-2xl font-bold text-green-600">
//                     {calculateProfileCompletion()}%
//                   </p>
//                 </div>

//                 {!isEditing ? (
//                   <button
//                     className="btn btn-primary px-5 py-2"
//                     onClick={() => setIsEditing(true)}
//                   >
//                     Edit
//                   </button>
//                 ) : (
//                   <>
//                     <button
//                       className="btn btn-primary px-5 py-2"
//                       onClick={handleSave}
//                       disabled={saving}
//                     >
//                       {saving ? "Saving..." : "Save"}
//                     </button>

//                     <button
//                       className="btn btn-secondary px-5 py-2"
//                       onClick={handleCancel}
//                     >
//                       Cancel
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Progress bar */}
//             <div className="w-full bg-gray-200 h-2 rounded mt-4">
//               <div
//                 className="bg-green-600 h-2 rounded"
//                 style={{
//                   width: `${calculateProfileCompletion()}%`,
//                 }}
//               ></div>
//             </div>
//           </div>

//           {/* TABS */}
//           <div className="bg-white rounded shadow">
//             <div className="border-b">
//               <nav className="flex">
//                 {["personal", "company", "subscription"].map((t) => (
//                   <button
//                     key={t}
//                     onClick={() => setActiveTab(t)}
//                     className={`px-6 py-4 text-sm font-medium border-b-2 ${
//                       activeTab === t
//                         ? "border-blue-600 text-blue-600"
//                         : "border-transparent text-gray-500"
//                     }`}
//                   >
//                     {t === "personal" && "Personal Info"}
//                     {t === "company" && "Company Info"}
//                     {t === "subscription" && "Subscription"}
//                   </button>
//                 ))}
//               </nav>
//             </div>

//             <div className="p-6">
//               {/* PERSONAL TAB */}
//               {activeTab === "personal" && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//                   <InputField
//                     label="Full Name"
//                     name="name"
//                     value={formData.name}
//                     isEditing={isEditing}
//                     onChange={handleInputChange}
//                     required
//                   />

//                   <InputField
//                     label="Email Address"
//                     name="email"
//                     type="email"
//                     value={formData.email}
//                     isEditing={false} // email not editable
//                     readOnly
//                     required
//                   />

//                   <InputField
//                     label="Phone Number"
//                     name="phone_number"
//                     value={formData.phone_number}
//                     isEditing={isEditing}
//                     onChange={handleInputChange}
//                   />

//                   <InputField
//                     label="Job Role"
//                     name="role"
//                     value={formData.role}
//                     isEditing={isEditing}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//               )}

//               {/* COMPANY TAB */}
//               {activeTab === "company" && (
//                 <>
//                   {/* Logo */}
//                   <div className="mb-6">
//                     <p className="text-sm font-medium mb-2">Company Logo</p>

//                     <div className="flex items-center gap-4">
//                       <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
//                         <img
//                           src={
//                             logoPreview ||
//                             formData.company_logo ||
//                             "/placeholder.png"
//                           }
//                           className="w-full h-full object-cover"
//                         />
//                       </div>

//                       {isEditing && (
//                         <>
//                           <input
//                             id="logoUpload"
//                             type="file"
//                             className="hidden"
//                             accept="image/*"
//                             onChange={handleLogoChange}
//                           />
//                           <label
//                             htmlFor="logoUpload"
//                             className="btn btn-secondary px-4 py-2 cursor-pointer"
//                           >
//                             Upload
//                           </label>
//                         </>
//                       )}
//                     </div>
//                   </div>

//                   {/* Company Fields */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//                     <InputField
//                       label="Company Name"
//                       name="company_name"
//                       value={formData.company_name}
//                       isEditing={isEditing}
//                       onChange={handleInputChange}
//                       required
//                     />

//                     <SelectField
//                       label="Industry"
//                       name="industry"
//                       value={formData.industry}
//                       onChange={handleInputChange}
//                       isEditing={isEditing}
//                       options={[
//                         "Technology",
//                         "Healthcare",
//                         "Finance",
//                         "Education",
//                         "Manufacturing",
//                         "Retail",
//                         "Consulting",
//                         "Other",
//                       ]}
//                       required
//                     />

//                     <SelectField
//                       label="Company Size"
//                       name="company_size"
//                       value={formData.company_size}
//                       onChange={handleInputChange}
//                       isEditing={isEditing}
//                       options={[
//                         "1-10",
//                         "11-50",
//                         "51-200",
//                         "201-500",
//                         "501-1000",
//                         "1000+",
//                       ]}
//                       required
//                     />

//                     <InputField
//                       label="Year Founded"
//                       name="year_founded"
//                       type="number"
//                       value={formData.year_founded}
//                       isEditing={isEditing}
//                       onChange={handleInputChange}
//                     />

//                     <InputField
//                       label="Website"
//                       name="website"
//                       value={formData.website}
//                       isEditing={isEditing}
//                       onChange={handleInputChange}
//                     />

//                     <InputField
//                       label="Headquarters"
//                       name="headquarters_location"
//                       value={formData.headquarters_location}
//                       isEditing={isEditing}
//                       onChange={handleInputChange}
//                     />
//                   </div>

//                   <TextAreaField
//                     label="Short Overview"
//                     name="short_overview"
//                     value={formData.short_overview}
//                     isEditing={isEditing}
//                     onChange={handleInputChange}
//                     required
//                   />

//                   <TextAreaField
//                     label="Detailed Description"
//                     name="detailed_description"
//                     value={formData.detailed_description}
//                     isEditing={isEditing}
//                     onChange={handleInputChange}
//                   />
//                 </>
//               )}

//               {/* SUBSCRIPTION TAB */}
//               {activeTab === "subscription" && (
//                 <div>
//                   <h2 className="text-lg font-semibold mb-3">
//                     Subscription Information
//                   </h2>

//                   <p className="mb-2">
//                     Status:{" "}
//                     <strong>
//                       {recruiterData.subscription_status || "Free"}
//                     </strong>
//                   </p>

//                   <p className="mb-2">
//                     Expiry:{" "}
//                     <strong>
//                       {formatDate(recruiterData.subscription_expiry)}
//                     </strong>
//                   </p>

//                   <p className="mb-2">
//                     Job Posts Left:{" "}
//                     <strong>{recruiterData.job_post_limit ?? 5}</strong>
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>

//       <Footer />

//       {/* Toast */}
//       {toast && (
//         <Toast
//           message={toast.message}
//           type={toast.type}
//           onClose={hideToast}
//         />
//       )}
//     </>
//   );
// }

// // ---------------------------------------------------------
// // Reusable Components
// // ---------------------------------------------------------
// function InputField({
//   label,
//   name,
//   value,
//   onChange,
//   isEditing,
//   type = "text",
//   required,
//   readOnly = false,
// }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-2">
//         {label} {required && "*"}
//       </label>

//       {isEditing && !readOnly ? (
//         <input
//           type={type}
//           name={name}
//           value={value || ""}
//           onChange={onChange}
//           className="w-full px-3 py-2 border rounded"
//         />
//       ) : (
//         <p className="py-2 text-gray-700">{value || "Not provided"}</p>
//       )}
//     </div>
//   );
// }

// function SelectField({
//   label,
//   name,
//   value,
//   onChange,
//   isEditing,
//   options,
//   required,
// }) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-2">
//         {label} {required && "*"}
//       </label>

//       {isEditing ? (
//         <select
//           name={name}
//           value={value || ""}
//           onChange={onChange}
//           className="w-full px-3 py-2 border rounded"
//         >
//           <option value="">Select…</option>
//           {options.map((o) => (
//             <option key={o} value={o}>
//               {o}
//             </option>
//           ))}
//         </select>
//       ) : (
//         <p className="py-2 text-gray-700">{value || "Not specified"}</p>
//       )}
//     </div>
//   );
// }

// function TextAreaField({
//   label,
//   name,
//   value,
//   onChange,
//   isEditing,
//   required,
// }) {
//   return (
//     <div className="mt-4">
//       <label className="block text-sm font-medium text-gray-700 mb-2">
//         {label} {required && "*"}
//       </label>

//       {isEditing ? (
//         <textarea
//           name={name}
//           value={value || ""}
//           rows={4}
//           onChange={onChange}
//           className="w-full px-3 py-2 border rounded"
//         ></textarea>
//       ) : (
//         <p className="py-2 text-gray-700 whitespace-pre-wrap">
//           {value || "Not provided"}
//         </p>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import apiService from "../../../utils/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// -------------------- Toast --------------------
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg text-white ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <div className="flex items-center">
        <span className="flex-1">{message}</span>
        <button className="ml-3 font-bold text-xl" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

// ----------------- Main Page -------------------
export default function RecruiterProfile() {
  const router = useRouter();

  const [recruiterData, setRecruiterData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [logoPreview, setLogoPreview] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") =>
    setToast({ message, type });
  const hideToast = () => setToast(null);

  // -------- Load profile on mount ----------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = apiService.getToken();
        const fallback = apiService.getUserData();

        if (!token || !fallback) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/recruiters/profile/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setRecruiterData(data.recruiter);
          setFormData(data.recruiter);
        } else {
          setRecruiterData(fallback);
          setFormData(fallback);
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // -------------- Input Handler -----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // -------------- Logo Upload -----------------
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);

    const token = apiService.getToken();
    const fd = new FormData();
    fd.append("logo", file);

    try {
      const res = await fetch(
        `${API_BASE_URL}/recruiters/profile/logo`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );

      const data = await res.json();

      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          company_logo: data.logoUrl,
        }));
        showToast("Logo uploaded successfully");
      } else {
        showToast(data.message || "Logo upload failed", "error");
      }
    } catch (err) {
      showToast("Error uploading logo", "error");
    }
  };

  // ------------------- FIXED SAVE BUTTON -------------------
  const handleSave = async () => {
    setSaving(true);

    try {
      const token = apiService.getToken();

      // Fields backend allows
      const allowedFields = [
        "name",
        "company_name",
        "company_type",
        "category",
        "industry",
        "company_size",
        "year_founded",
        "official_email",
        "phone_number",
        "website",
        "headquarters_location",
        "short_overview",
        "detailed_description",
        "company_logo",
        "linkedin",
        "instagram",
        "facebook",
        "role"
      ];

      const safeData = {};

      allowedFields.forEach((key) => {
        if (formData[key] !== undefined) {
          safeData[key] = formData[key];
        }
      });

      const res = await fetch(
        `${API_BASE_URL}/recruiters/profile/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(safeData),
        }
      );

      const data = await res.json();
      console.log("UPDATE RESPONSE:", data);

      if (res.ok) {
        setRecruiterData(data.recruiter);
        setFormData(data.recruiter);
        setIsEditing(false);
        setLogoPreview(null);
        showToast("Profile updated successfully", "success");
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };
  // ---------------------------------------------------------

  const handleCancel = () => {
    setFormData(recruiterData);
    setLogoPreview(null);
    setIsEditing(false);
  };

  const calculateProfileCompletion = () => {
    if (!formData) return 0;

    const requiredFields = [
      "name",
      "email",
      "role",
      "company_name",
      "industry",
      "company_size",
      "short_overview",
    ];

    let filled = requiredFields.filter(
      (key) => formData[key] && formData[key].toString().trim() !== ""
    ).length;

    return Math.round((filled / requiredFields.length) * 100);
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Not updated";

  // -------------- Loading state --------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Loading...
      </div>
    );
  }

  if (!recruiterData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Failed to load profile.
      </div>
    );
  }

  // ------------------- UI --------------------
  return (
    <>
      <Head>
        <title>Recruiter Profile</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50 pt-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Recruiter Profile</h1>
                <p className="text-gray-600">Manage your information</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Completion</p>
                  <p className="text-2xl font-bold text-green-600">
                    {calculateProfileCompletion()}%
                  </p>
                </div>

                {!isEditing ? (
                  <button
                    className="btn btn-primary px-5 py-2"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-primary px-5 py-2"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn btn-secondary px-5 py-2"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded mt-4">
              <div
                className="bg-green-600 h-2 rounded"
                style={{ width: `${calculateProfileCompletion()}%` }}
              />
            </div>
          </div>

          {/* TABS & CONTENT */}
          <div className="bg-white rounded shadow">
            <div className="border-b">
              <nav className="flex">
                {["personal", "company", "subscription"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    {tab === "personal" && "Personal Info"}
                    {tab === "company" && "Company Info"}
                    {tab === "subscription" && "Subscription"}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* PERSONAL TAB */}
              {activeTab === "personal" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Full Name" name="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} required />

                  <InputField label="Email Address" name="email" type="email" value={formData.email} isEditing={false} readOnly required />

                  <InputField label="Phone Number" name="phone_number" value={formData.phone_number} isEditing={isEditing} onChange={handleInputChange} />

                  <InputField label="Job Role" name="role" value={formData.role} isEditing={isEditing} onChange={handleInputChange} required />

                  <div className="md:col-span-2 text-sm text-gray-500 mt-2">
                    Last updated: {formatDate(recruiterData.updated_at)}
                  </div>
                </div>
              )}

              {/* COMPANY TAB */}
              {activeTab === "company" && (
                <>
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Company Logo</p>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={logoPreview || formData.company_logo || "/placeholder.png"}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {isEditing && (
                        <>
                          <input id="logoUpload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                          <label htmlFor="logoUpload" className="btn btn-secondary px-4 py-2 cursor-pointer">
                            Upload
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Company Name" name="company_name" value={formData.company_name} isEditing={isEditing} onChange={handleInputChange} required />

                    <InputField label="Category" name="category" value={formData.category} isEditing={isEditing} onChange={handleInputChange} />

                    <SelectField label="Industry" name="industry" value={formData.industry} onChange={handleInputChange} isEditing={isEditing} required options={[
                      "Technology",
                      "Healthcare",
                      "Finance",
                      "Education",
                      "Manufacturing",
                      "Retail",
                      "Consulting",
                      "Other",
                    ]} />

                    <SelectField label="Company Size" name="company_size" value={formData.company_size} onChange={handleInputChange} isEditing={isEditing} required options={[
                      "1-10",
                      "11-50",
                      "51-200",
                      "201-500",
                      "501-1000",
                      "1000+",
                    ]} />

                    <InputField label="Year Founded" name="year_founded" type="number" value={formData.year_founded} isEditing={isEditing} onChange={handleInputChange} />

                    <InputField label="Website" name="website" value={formData.website} isEditing={isEditing} onChange={handleInputChange} />

                    <InputField label="Headquarters" name="headquarters_location" value={formData.headquarters_location} isEditing={isEditing} onChange={handleInputChange} />
                  </div>

                  <TextAreaField label="Short Overview" name="short_overview" value={formData.short_overview} isEditing={isEditing} onChange={handleInputChange} required />

                  <TextAreaField label="Detailed Description" name="detailed_description" value={formData.detailed_description} isEditing={isEditing} onChange={handleInputChange} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <InputField label="LinkedIn" name="linkedin" value={formData.linkedin} isEditing={isEditing} onChange={handleInputChange} />
                    <InputField label="Instagram" name="instagram" value={formData.instagram} isEditing={isEditing} onChange={handleInputChange} />
                    <InputField label="Facebook" name="facebook" value={formData.facebook} isEditing={isEditing} onChange={handleInputChange} />
                  </div>
                </>
              )}

              {/* SUBSCRIPTION TAB */}
              {activeTab === "subscription" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Subscription Information
                  </h2>
                  <p className="mb-2">
                    Status: <strong>{recruiterData.subscription_status || "Free"}</strong>
                  </p>
                  <p className="mb-2">
                    Expiry: <strong>{formatDate(recruiterData.subscription_expiry)}</strong>
                  </p>
                  <p className="mb-2">
                    Job Posts Left: <strong>{recruiterData.job_post_limit ?? 5}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
}

// --------------- Reusable Fields ----------------
function InputField({
  label,
  name,
  value,
  onChange,
  isEditing,
  type = "text",
  required,
  readOnly = false,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"}
      </label>
      {isEditing && !readOnly ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      ) : (
        <p className="py-2 text-gray-700">{value || "Not provided"}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  isEditing,
  options,
  required,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"}
      </label>
      {isEditing ? (
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <p className="py-2 text-gray-700">{value || "Not specified"}</p>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  isEditing,
  required,
}) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"}
      </label>
      {isEditing ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          rows={4}
          className="w-full px-3 py-2 border rounded"
        />
      ) : (
        <p className="py-2 text-gray-700 whitespace-pre-wrap">
          {value || "Not provided"}
        </p>
      )}
    </div>
  );
}


