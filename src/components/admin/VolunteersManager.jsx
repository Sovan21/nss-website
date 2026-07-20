"use client";

import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { DEPARTMENTS, YEARS } from '@/lib/constants';
import { compressImage, formatDate, useDebounce, deleteSupabaseImage, getInitials } from '@/lib/utils';

// ============================================================================
// SECTION 1: VOLUNTEERS MANAGER (EXACT ORIGINAL UI RESTORED)
// ============================================================================
const VolunteersManager = ({ setIsDirty }) => {
 const { toast, confirm } = useToast();
 const [volunteers, setVolunteers] = useState([]);
 const [totalVolunteers, setTotalVolunteers] = useState(0);
 const [loading, setLoading] = useState(true);
 const [selectedVol, setSelectedVol] = useState(null);

 // Edit States
 const [isEditingProfile, setIsEditingProfile] = useState(false);
 const [editFormData, setEditFormData] = useState({});
 const [editImageFile, setEditImageFile] = useState(null);
 const [saving, setSaving] = useState(false);
 const [removeImage, setRemoveImage] = useState(false);

 // Delete Confirmation States
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
 const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [sortBy, setSortBy] = useState('name_asc'); // Default A-Z ascending
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => { setIsDirty(isEditingProfile); }, [isEditingProfile, setIsDirty]);

  // Reset to page 1 whenever filters or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterBloodGroup, filterGender, filterSemester, sortBy]);
  
  // Re-fetch data when search, filter, sort, or page changes
  useEffect(() => {
    fetchVolunteers(currentPage, debouncedSearchTerm, filterBloodGroup, filterGender, filterSemester, sortBy);
  }, [currentPage, debouncedSearchTerm, filterBloodGroup, filterGender, filterSemester, sortBy]);

  const fetchVolunteers = async (page, search, bloodGroup, gender, semester, sort) => {
    setLoading(true);
    try {
      let query = supabase.from('registrations').select('*', { count: 'exact' }).eq('role', 'volunteer');

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,college_application_id.ilike.%${search}%,aadhaar_no.ilike.%${search}%`);
      }
      if (bloodGroup) {
        query = query.eq('blood_group', bloodGroup);
      }
      if (gender) {
        query = query.eq('gender', gender);
      }
      if (semester) {
        if (semester === 'Pass Out') {
          query = query.ilike('semester', '%Pass Out%');
        } else {
          query = query.ilike('semester', `%${semester}%`);
        }
      }

      // Apply Sorting
      if (sort === 'name_asc') {
        query = query.order('full_name', { ascending: true });
      } else if (sort === 'name_desc') {
        query = query.order('full_name', { ascending: false });
      } else if (sort === 'newest') {
        query = query.order('id', { ascending: false });
      } else if (sort === 'oldest') {
        query = query.order('id', { ascending: true });
      } else {
        query = query.order('full_name', { ascending: true });
      }

      const from = (page - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setVolunteers(data || []);
      setTotalVolunteers(count || 0);
    } catch (err) { console.error("Error fetching volunteers:", err); } finally { setLoading(false); }
  };

 const exportToCSV = () => {
 if (volunteers.length === 0) return toast.warning("No data available to export!");
 const headers = ["ID","Full Name","Father's Name","Mother's Name","Aadhaar Number","Department","Semester","College Application ID","Extra Curriculum","Previous Experience","Phone","WhatsApp","Email","Blood Group","Gender","DOB","Address"];
 const csvRows = volunteers.map(vol => [
 vol.id, `"${vol.full_name || ''}"`, `"${vol.fathers_name || ''}"`, `"${vol.mothers_name || ''}"`, `"${vol.aadhaar_no || ''}"`,
 `"${vol.department || ''}"`, `"${vol.semester || ''}"`, `"${vol.college_application_id || ''}"`, `"${vol.extra_curriculum || ''}"`, `"${vol.prev_experience || ''}"`,
 `"${vol.phone || ''}"`, `"${vol.whatsapp || ''}"`, `"${vol.email || ''}"`, `"${vol.blood_group || ''}"`, `"${vol.gender || ''}"`,
 `"${vol.dob ? formatDate(vol.dob) : ''}"`, `"${vol.current_address ? vol.current_address.replace(/"/g, '""') : ''}"`
 ].join(','));
 const csvString = [headers.join(','), ...csvRows].join('\n');
 const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a'); link.href = url;
 link.setAttribute('download', `NSS_Volunteers_${new Date().toISOString().split('T')[0]}.csv`);
 document.body.appendChild(link); link.click(); document.body.removeChild(link);
 };

 const openEditMode = () => {
 setEditFormData({ ...selectedVol });
 setEditImageFile(null);
 setRemoveImage(false);
 setIsEditingProfile(true);
 };

 const handleEditInputChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

 const handleUpdateVolunteer = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 let updatedPhotoUrl = selectedVol.photo_url;
 
 if (removeImage && updatedPhotoUrl) {
 await deleteSupabaseImage(selectedVol.photo_url);
 updatedPhotoUrl = null;
 } else if (editImageFile) {
 if (selectedVol.photo_url) await deleteSupabaseImage(selectedVol.photo_url);
 const compressed = await compressImage(editImageFile, 2, 800); // Max 2MB for volunteers
 const fileExt = compressed.name.split('.').pop();
 const fileName = `registration-${Date.now()}.${fileExt}`;
 await supabase.storage.from('nss-images').upload(fileName, compressed);
 updatedPhotoUrl = supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl;
 }
 const finalData = { ...editFormData, photo_url: updatedPhotoUrl };
 const { error } = await supabase.from('registrations').update(finalData).eq('id', selectedVol.id);
 if (error) throw error;

 toast.success("Volunteer Profile Updated Successfully!");
 setIsEditingProfile(false);
 setSelectedVol(finalData);
 fetchVolunteers(currentPage, debouncedSearchTerm, filterBloodGroup);
 } catch (err) { toast.error("Failed to update volunteer."); } finally { setSaving(false); }
 };

  const handleDeleteVolunteer = async () => {
    setDeleting(true);
    try {
      await deleteSupabaseImage(selectedVol.photo_url);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: selectedVol.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user via API');
      }

      toast.success("Volunteer and all associated data have been completely removed.");
      setShowDeleteConfirm(false);
      setSelectedVol(null);
      fetchVolunteers(currentPage, debouncedSearchTerm, filterBloodGroup);
    } catch (err) {
      console.error("Deletion Error:", err);
      toast.error(`Failed to delete volunteer: ${err.message}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

 return (
 <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-t-4 border-red-500 relative">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
 <div>
 <h3 className="text-xl md:text-2xl font-bold text-gray-800">Volunteers</h3>
 <p className="text-xs text-gray-500 mt-0.5">
 Showing {volunteers.length} of <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded shadow-sm">{totalVolunteers}</span>
 </p>
 </div>
 <button onClick={exportToCSV} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition text-sm whitespace-nowrap">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export CSV
 </button>
 </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
        {/* Search Box */}
        <div className="sm:col-span-2 lg:col-span-1 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search Name, Phone, App ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-xs sm:text-sm font-medium shadow-2xs" 
          />
        </div>

        {/* Sort By (Default: A-Z) */}
        <div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-xs sm:text-sm cursor-pointer text-gray-700 font-semibold shadow-2xs">
            <option value="name_asc">Sort: Name (A - Z)</option>
            <option value="name_desc">Sort: Name (Z - A)</option>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-xs sm:text-sm cursor-pointer text-gray-700 font-medium shadow-2xs">
            <option value="">All Semesters</option>
            <option value="1st">1st Sem</option>
            <option value="2nd">2nd Sem</option>
            <option value="3rd">3rd Sem</option>
            <option value="4th">4th Sem</option>
            <option value="5th">5th Sem</option>
            <option value="6th">6th Sem</option>
            <option value="7th">7th Sem</option>
            <option value="8th">8th Sem</option>
            <option value="Pass Out">Pass Out</option>
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-xs sm:text-sm cursor-pointer text-gray-700 font-medium shadow-2xs">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Blood Group Filter */}
        <div>
          <select value={filterBloodGroup} onChange={(e) => setFilterBloodGroup(e.target.value)} className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-xs sm:text-sm cursor-pointer text-gray-700 font-medium shadow-2xs">
            <option value="">All Blood Groups</option>
            <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
          </select>
        </div>
      </div>

 {loading ? (
 <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading volunteers...</div>
 ) : volunteers.length === 0 ? (
 <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
 <p className="text-gray-500 font-medium">No volunteers found matching your search.</p>
 </div>
 ) : (
 <div className="overflow-x-auto rounded-lg border border-gray-100">
 <table className="w-full text-left border-collapse bg-white whitespace-nowrap">
 <thead>
 <tr className="bg-slate-800 text-white text-sm">
 <th className="py-3 px-4 font-semibold">Photo</th>
 <th className="py-3 px-4 font-semibold">Full Name</th>
 <th className="py-3 px-4 font-semibold">Dept & Sem</th>
 <th className="py-3 px-4 font-semibold">Contact</th>
 <th className="py-3 px-4 font-semibold text-center">Action</th>
 </tr>
 </thead>
 <tbody className="text-gray-700 text-sm">
 {volunteers.map((vol, index) => (
 <tr key={vol.id} className={`border-b border-gray-100 hover:bg-red-50 transition ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
 <td className="py-2 px-4">
 {vol.photo_url ? (
 <img src={vol.photo_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-red-200 shadow-sm" />
 ) : (
 <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-extrabold shadow-sm text-xs">
 {getInitials(vol.full_name)}
 </div>
 )}
 </td>
 <td className="py-3 px-4">
 <p className="font-bold text-gray-800">{vol.full_name}</p>
 </td>
 <td className="py-3 px-4">
 <p className="font-medium">{vol.department}</p>
 <p className="text-xs text-blue-600 font-semibold">{vol.semester && vol.semester.includes('Pass Out') ? vol.semester : `${vol.semester} Sem`}</p>
 </td>
 <td className="py-3 px-4">
 <p className="font-medium text-gray-800">{vol.phone}</p>
 </td>
 <td className="py-3 px-4 text-center">
 <button onClick={() => { setSelectedVol(vol); setIsEditingProfile(false); }} className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 font-bold py-1.5 px-4 rounded-lg transition text-xs shadow-sm">
 Manage Profile
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {/* Pagination Controls */}
 {!loading && totalVolunteers > rowsPerPage && (
 <div className="flex justify-between items-center mt-6">
 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-bold text-white bg-slate-600 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed">
 Previous
 </button>
 <span className="text-sm font-semibold text-gray-600">Page {currentPage} of {Math.ceil(totalVolunteers / rowsPerPage)}</span>
 <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * rowsPerPage >= totalVolunteers} className="px-4 py-2 text-sm font-bold text-white bg-slate-600 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed">
 Next
 </button>
 </div>
 )}

 {showDeleteConfirm && selectedVol && (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[250] p-4 animate-fade-in-up">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center border-t-4 border-red-500">
 <h3 className="text-xl font-extrabold text-red-600 mb-2">Confirm Deletion</h3>
 <p className="text-sm text-gray-600 mb-4">
 This action is irreversible. To confirm, please type the full name of the volunteer: <br/>
 <strong className="font-bold text-gray-900 mt-1 block">{selectedVol.full_name}</strong>
 </p>
 <input
 type="text"
 value={deleteConfirmInput}
 onChange={(e) => setDeleteConfirmInput(e.target.value)}
 className="w-full p-2.5 border border-gray-300 rounded-lg text-center mb-4 focus:ring-2 focus:ring-red-500 outline-none"
 placeholder="Type the name here"
 />
 <div className="flex gap-3">
  <button
  onClick={() => setShowDeleteConfirm(false)}
  disabled={deleting}
  className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
  Cancel
  </button>
  <button
  onClick={handleDeleteVolunteer}
  disabled={deleteConfirmInput !== selectedVol.full_name || deleting}
  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl transition disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
  {deleting ? (
    <>
      <svg className="animate-spin h-4 w-4 text-white shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Deleting...
    </>
  ) : 'Confirm & Delete'}
  </button>
  </div>
 </div>
 </div>
 )}

 {selectedVol && (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in-up">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
 <div className="bg-slate-900 p-4 shrink-0 flex justify-between items-center text-white border-b-4 border-red-500">
 <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 truncate">
 {isEditingProfile ?"Edit Profile" :"Volunteer Profile"}
 </h3>
 <div className="flex items-center gap-2 sm:gap-3 shrink-0">
 {!isEditingProfile && (
 <>
 <button onClick={openEditMode} className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition shadow-sm whitespace-nowrap">Edit</button>
 <button onClick={() => { setDeleteConfirmInput(''); setShowDeleteConfirm(true); }} className="bg-red-600 hover:bg-red-500 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition shadow-sm whitespace-nowrap">Delete</button>
 </>
 )}
 <button onClick={() => { setSelectedVol(null); setIsEditingProfile(false); }} className="text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-1.5 transition ml-1 sm:ml-2">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>
 </div>

 <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
 {!isEditingProfile ? (
 <>
 <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6">
 <div className="shrink-0 relative">
 {selectedVol.photo_url ? (
 <img src={selectedVol.photo_url} alt="Profile" className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md bg-gray-100" />
 ) : (
 <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-slate-200 flex items-center justify-center">
 <span className="text-slate-500 font-extrabold text-4xl sm:text-5xl">{getInitials(selectedVol.full_name)}</span>
 </div>
 )}
 </div>
 <div className="text-center sm:text-left flex-1 w-full">
 <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">{selectedVol.full_name}</h2>
 <p className="text-blue-600 font-bold bg-blue-50 inline-block px-3 py-1 rounded-lg text-xs sm:text-sm mb-2">{selectedVol.department} • {selectedVol.semester && selectedVol.semester.includes('Pass Out') ? selectedVol.semester : `${selectedVol.semester} Sem`}</p>
 <p className="text-gray-500 text-xs sm:text-sm font-semibold mb-3">College Application ID: <span className="text-gray-800">{selectedVol.college_application_id}</span></p>
 <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
 <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center">
 <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 21.5c3.59 0 6.5-2.91 6.5-6.5 0-4-6.5-12-6.5-12S5.5 11 5.5 15c0 3.59 2.91 6.5 6.5 6.5z" /></svg>
 {selectedVol.blood_group || 'N/A'}
 </span>
 <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center">
 <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
 {selectedVol.gender}
 </span>
 <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center">
 <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
 {formatDate(selectedVol.dob)}
 </span>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
 <h4 className="font-extrabold text-gray-800 mb-3 text-xs sm:text-sm border-b pb-2">Family & Personal Info</h4>
 <p className="text-xs sm:text-sm mb-1.5"><span className="text-gray-500 font-medium">Father's Name:</span> <span className="font-bold text-gray-900">{selectedVol.fathers_name || "N/A"}</span></p>
 <p className="text-xs sm:text-sm mb-1.5"><span className="text-gray-500 font-medium">Mother's Name:</span> <span className="font-bold text-gray-900">{selectedVol.mothers_name || "N/A"}</span></p>
 <p className="text-xs sm:text-sm mb-1"><span className="text-gray-500 font-medium">Aadhaar Number:</span> <span className="font-bold text-gray-900">{selectedVol.aadhaar_no || "N/A"}</span></p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
 <h4 className="font-extrabold text-gray-800 mb-3 text-xs sm:text-sm border-b pb-2">Experience & Activities</h4>
 <p className="text-xs sm:text-sm mb-1.5"><span className="text-gray-500 font-medium">Previous Experience:</span> <span className="font-bold text-gray-900">{selectedVol.prev_experience || "N/A"}</span></p>
 <p className="text-xs sm:text-sm mb-1"><span className="text-gray-500 font-medium">Extra Curriculum:</span> <span className="font-bold text-gray-900 leading-relaxed">{selectedVol.extra_curriculum || "N/A"}</span></p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
 <h4 className="font-extrabold text-gray-800 mb-3 text-xs sm:text-sm border-b pb-2">Contact Info</h4>
 <p className="text-xs sm:text-sm mb-1.5"><span className="text-gray-500 font-medium">Email:</span> <span className="font-bold text-gray-900 break-all">{selectedVol.email}</span></p>
 <p className="text-xs sm:text-sm mb-1.5"><span className="text-gray-500 font-medium">Phone:</span> <span className="font-bold text-gray-900">{selectedVol.phone}</span></p>
 <p className="text-xs sm:text-sm mb-1"><span className="text-gray-500 font-medium">WhatsApp:</span> <span className="font-bold text-green-600">{selectedVol.whatsapp ||"N/A"}</span></p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
 <h4 className="font-extrabold text-gray-800 mb-3 text-xs sm:text-sm border-b pb-2">Address</h4>
 <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{selectedVol.current_address}</p>
 </div>
 <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-inner">
 <h4 className="font-extrabold text-blue-900 mb-2 text-xs sm:text-sm">About / Motivation</h4>
 <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">"{selectedVol.bio}"</p>
 </div>
 </div>
 </>
 ) : (
 <form onSubmit={handleUpdateVolunteer} className="space-y-5">
 <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
 <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-md border-2 border-slate-100 flex items-center justify-center bg-slate-800 shrink-0">
 {editImageFile ? (
 <img src={URL.createObjectURL(editImageFile)} alt="New" className="w-full h-full object-cover" />
 ) : selectedVol?.photo_url && !removeImage ? (
 <img src={selectedVol.photo_url} alt="Current" className="w-full h-full object-cover" />
 ) : (
 <span className="text-white font-bold text-3xl">{getInitials(selectedVol?.full_name)}</span>
 )}
 </div>
 <div className="flex-1 w-full text-center sm:text-left flex flex-col justify-center">
 <label className="block text-xs font-bold text-gray-700 mb-2">Profile Picture</label>
 <div className="flex gap-2 items-center justify-center sm:justify-start w-full">
 <label className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-lg cursor-pointer transition shadow-sm whitespace-nowrap">
 {(selectedVol?.photo_url || editImageFile) && !removeImage ? 'Change Photo' : 'Add Photo'}
 <input type="file" accept="image/*" onChange={(e) => { setEditImageFile(e.target.files[0]); setRemoveImage(false); }} className="hidden"/>
 </label>
 {(selectedVol?.photo_url || editImageFile) && !removeImage && (
 <button type="button" onClick={() => { setRemoveImage(true); setEditImageFile(null); }} className="text-xs bg-red-50 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-100 transition shadow-sm whitespace-nowrap">Remove</button>
 )}
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
  <input required name="full_name" value={editFormData.full_name || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">College Application ID</label>
  <input required name="college_application_id" value={editFormData.college_application_id || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
  <select required name="department" value={editFormData.department || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm">
  <option value="">Select</option>
  {DEPARTMENTS.map(dept => (
    <option key={dept} value={dept}>{dept}</option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Semester</label>
  <select required name="semester" value={editFormData.semester && editFormData.semester.includes('Pass Out') ? 'Pass Out' : editFormData.semester || ''} onChange={(e) => {
    const val = e.target.value;
    if (val === 'Pass Out') {
      setEditFormData({ ...editFormData, semester: 'Pass Out - 2026' });
    } else {
      setEditFormData({ ...editFormData, semester: val });
    }
  }} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm">
  <option value="">Select</option>
  <option value="1st">1st Sem</option>
  <option value="2nd">2nd Sem</option>
  <option value="3rd">3rd Sem</option>
  <option value="4th">4th Sem</option>
  <option value="5th">5th Sem</option>
  <option value="6th">6th Sem</option>
  <option value="7th">7th Sem</option>
  <option value="8th">8th Sem</option>
  <option value="Pass Out">Pass Out</option>
  </select>
  {(editFormData.semester && editFormData.semester.includes('Pass Out')) && (
    <div className="mt-2">
      <label className="block text-[11px] font-bold text-gray-500 mb-0.5">Pass Out Year</label>
      <select
        required
        value={editFormData.semester.includes('-') ? editFormData.semester.split('-')[1].trim() : '2026'}
        onChange={(e) => {
          setEditFormData({ ...editFormData, semester: `Pass Out - ${e.target.value}` });
        }}
        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-xs shadow-sm"
      >
        <option value="">Select Year</option>
        {YEARS.map(yr => (
          <option key={yr} value={yr}>{yr}</option>
        ))}
      </select>
    </div>
  )}
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Father's Name</label>
  <input required name="fathers_name" value={editFormData.fathers_name || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Mother's Name</label>
  <input required name="mothers_name" value={editFormData.mothers_name || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Aadhaar Number</label>
  <input required name="aadhaar_no" value={editFormData.aadhaar_no || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Previous Experience</label>
  <select required name="prev_experience" value={editFormData.prev_experience || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm">
  <option value="">Select</option>
  <option value="Yes">Yes</option>
  <option value="No">No</option>
  </select>
  </div>
  <div className="md:col-span-2">
  <label className="block text-xs font-bold text-gray-700 mb-1">Extra Curriculum Activities</label>
  <input name="extra_curriculum" value={editFormData.extra_curriculum || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
  </div>
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
 <input required name="phone" value={editFormData.phone} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp</label>
 <input required name="whatsapp" value={editFormData.whatsapp} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
 </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Blood Group</label>
  <select name="blood_group" value={editFormData.blood_group} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm">
  <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
  <select required name="gender" value={editFormData.gender || ''} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm">
  <option value="">Select</option>
  <option value="Male">Male</option>
  <option value="Female">Female</option>
  <option value="Other">Other</option>
  </select>
  </div>
  <div>
  <label className="block text-xs font-bold text-gray-700 mb-1">DOB</label>
  <input type="date" required name="dob" value={editFormData.dob} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
  </div>
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-gray-700 mb-1">Current Address</label>
 <textarea required name="current_address" value={editFormData.current_address} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm" rows="2"></textarea>
 </div>
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-gray-700 mb-1">Bio</label>
 <textarea required name="bio" value={editFormData.bio} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm" rows="2"></textarea>
 </div>
 </div>
 <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t shrink-0">
 <button type="button" onClick={() => setIsEditingProfile(false)} className="w-full sm:w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition shadow-sm whitespace-nowrap">Cancel</button>
 <button type="submit" disabled={saving} className="w-full sm:w-2/3 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md whitespace-nowrap">{saving ? 'Saving...' : 'Save Changes'}</button>
 </div>
 </form>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default VolunteersManager;
