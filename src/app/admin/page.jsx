// File: src/app/admin/page.jsx
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // Updated for Next.js
import { supabaseAdmin as supabase } from '@/lib/supabase';// Updated path
import { useToast } from '@/components/Toast';


// ============================================================================
// UTILITY 1: DYNAMIC IMAGE COMPRESSOR (TARGET SIZE BASED)
// ============================================================================
const compressImage = (file, maxSizeMB = 6, maxWidth = 1920) => {
 return new Promise((resolve) => {
 if (!file || !file.type.startsWith('image/')) { resolve(file); return; }
 const reader = new FileReader();
 reader.readAsDataURL(file);
 reader.onload = (event) => {
 const img = new Image();
 img.src = event.target.result;
 img.onload = () => {
 const canvas = document.createElement('canvas');
 let width = img.width; let height = img.height;
 if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
 canvas.width = width; canvas.height = height;
 const ctx = canvas.getContext('2d');
 
 const maxSizeBytes = maxSizeMB * 1024 * 1024;
 let quality = 0.9;
 
 const attemptCompress = () => {
 ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height);
 ctx.drawImage(img, 0, 0, width, height);
 canvas.toBlob((blob) => {
 if (!blob) { resolve(file); return; }
 if (blob.size > maxSizeBytes && quality > 0.1) {
 quality -= 0.1;
 attemptCompress();
 } else {
 const newFileName = file.name.replace(/\.[^/.]+$/,".jpg");
 const compressedFile = new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() });
 const finalFile = compressedFile.size < file.size ? compressedFile : file;
 
 const origMB = (file.size / (1024 * 1024)).toFixed(2);
 const finalMB = (finalFile.size / (1024 * 1024)).toFixed(2);
 console.log(`📸 Compression [${file.name}]:\n📉 Before: ${origMB} MB\n📊 After: ${finalMB} MB\n🎯 Target: Max ${maxSizeMB} MB`);
 
 resolve(finalFile);
 }
 }, 'image/jpeg', quality);
 };
 attemptCompress();
 };
 img.onerror = () => resolve(file);
 };
 reader.onerror = () => resolve(file);
 });
};

// ============================================================================
// UTILITY 2: SECURE SUPABASE IMAGE DELETER
// ============================================================================
const deleteSupabaseImage = async (url) => {
 if (!url || url.includes('placeholder.com')) return;
 try {
 const fileName = url.split('/').pop();
 await supabase.storage.from('nss-images').remove([fileName]);
 } catch (error) {
 console.error("Error deleting old image:", error);
 }
};

// ============================================================================
// UTILITY 3: GET INITIALS FOR AVATAR
// ============================================================================
export const getInitials = (name) => {
 if (!name) return"U";
 const parts = name.trim().split("");
 if (parts.length === 1) return parts[0][0].toUpperCase();
 return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ============================================================================
// UTILITY 4: DEBOUNCE HOOK FOR SEARCH INPUT
// ============================================================================
const useDebounce = (value, delay) => {
 const [debouncedValue, setDebouncedValue] = useState(value);
 useEffect(() => {
 const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
 return () => { clearTimeout(handler); };
 }, [value, delay]);
 return debouncedValue;
};

// ============================================================================
// SECTION 1: VOLUNTEERS MANAGER
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

 const [searchTerm, setSearchTerm] = useState('');
 const [filterBloodGroup, setFilterBloodGroup] = useState('');
 const [currentPage, setCurrentPage] = useState(1);
 const rowsPerPage = 10;

 const debouncedSearchTerm = useDebounce(searchTerm, 300);

 useEffect(() => { setIsDirty(isEditingProfile); }, [isEditingProfile, setIsDirty]);
 
 // Re-fetch data when search, filter, or page changes
 useEffect(() => {
 fetchVolunteers(currentPage, debouncedSearchTerm, filterBloodGroup);
 }, [currentPage, debouncedSearchTerm, filterBloodGroup]);

 const fetchVolunteers = async (page, search, bloodGroup) => {
 setLoading(true);
 try {
 let query = supabase.from('registrations').select('*', { count: 'exact' }).eq('role', 'volunteer');

 if (search) {
 query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,roll_no.ilike.%${search}%`);
 }
 if (bloodGroup) {
 query = query.eq('blood_group', bloodGroup);
 }

 const from = (page - 1) * rowsPerPage;
 const to = from + rowsPerPage - 1;
 query = query.range(from, to).order('id', { ascending: false });

 const { data, error, count } = await query;
 if (error) throw error;

 setVolunteers(data || []);
 setTotalVolunteers(count || 0);
 } catch (err) { console.error("Error fetching volunteers:", err); } finally { setLoading(false); }
 };

 const exportToCSV = () => {
 if (volunteers.length === 0) return toast.warning("No data available to export!");
 const headers = ["ID","Full Name","Department","Semester","Roll No","Phone","WhatsApp","Email","Blood Group","Gender","DOB","Address"];
 const csvRows = volunteers.map(vol => [
 vol.id, `"${vol.full_name || ''}"`, `"${vol.department || ''}"`, `"${vol.semester || ''}"`, `"${vol.roll_no || ''}"`,
 `"${vol.phone || ''}"`, `"${vol.whatsapp || ''}"`, `"${vol.email || ''}"`, `"${vol.blood_group || ''}"`, `"${vol.gender || ''}"`,
 `"${vol.dob || ''}"`, `"${vol.current_address ? vol.current_address.replace(/"/g, '""') : ''}"`
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
 // Confirmation is now handled by the modal's disabled button state
 try {
 // Step 1: Delete the user's profile picture from storage first.
 await deleteSupabaseImage(selectedVol.photo_url);

 // Step 2: Call our secure API route to delete the user from Supabase Auth
 // This will completely remove them from the authentication system.
 // Note: Because of ON DELETE CASCADE, this will also automatically delete 
 // their profile from the 'registrations' table.
 const response = await fetch('/api/admin/delete-user', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
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
 // Ensure the modal is always closed
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

 <div className="flex flex-col sm:flex-row gap-3 mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
 <div className="flex-1 relative">
 <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
 <input type="text" placeholder="Search Name, Phone or Roll..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-sm" />
 </div>
 <div className="w-full sm:w-40 shrink-0">
 <select value={filterBloodGroup} onChange={(e) => setFilterBloodGroup(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition text-sm cursor-pointer text-gray-700">
 <option value="">All Blood Groups</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
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
 <p className="text-xs text-blue-600 font-semibold">{vol.semester} Sem</p>
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
 className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition"
 >
 Cancel
 </button>
 <button
 onClick={handleDeleteVolunteer}
 disabled={deleteConfirmInput !== selectedVol.full_name}
 className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl transition disabled:bg-red-300 disabled:cursor-not-allowed"
 >
 Confirm & Delete
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
 <p className="text-blue-600 font-bold bg-blue-50 inline-block px-3 py-1 rounded-lg text-xs sm:text-sm mb-2">{selectedVol.department} • {selectedVol.semester} Sem</p>
 <p className="text-gray-500 text-xs sm:text-sm font-semibold mb-3">Roll No: <span className="text-gray-800">{selectedVol.roll_no}</span></p>
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
 {selectedVol.dob}
 </span>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
 <input required name="full_name" value={editFormData.full_name} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1">Roll No</label>
 <input required name="roll_no" value={editFormData.roll_no} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
 <input required name="department" value={editFormData.department} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1">Semester</label>
 <input required name="semester" value={editFormData.semester} onChange={handleEditInputChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm shadow-sm"/>
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

// ============================================================================
// SECTION 2: COMMITTEE MANAGER
// ============================================================================
const CommitteeManager = ({ setIsDirty }) => {
 const { toast, confirm } = useToast();
 const [members, setMembers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showAddForm, setShowAddForm] = useState(false);
 const [newMember, setNewMember] = useState({ name: '', designation: '', about: '' });
 const [bannerFile, setBannerFile] = useState(null);
 const [saving, setSaving] = useState(false);

 const [editingMember, setEditingMember] = useState(null);
 const [editFormData, setEditFormData] = useState({ name: '', designation: '', about: '' });
 const [editImageFile, setEditImageFile] = useState(null);
 const [removeImage, setRemoveImage] = useState(false);

 useEffect(() => { setIsDirty(showAddForm || editingMember !== null); }, [showAddForm, editingMember, setIsDirty]);
 useEffect(() => { fetchMembers(); }, []);

 const fetchMembers = async () => {
 try {
 const { data, error } = await supabase.from('committee').select('*').order('id', { ascending: true });
 if (error) throw error;
 setMembers(data || []);
 } catch (err) { console.error("Error fetching members:", err); } finally { setLoading(false); }
 };

 const handleAddInputChange = (e) => setNewMember({ ...newMember, [e.target.name]: e.target.value });

 const handleAddMember = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 let imageUrl = null;
 if (bannerFile) {
 const compressedFile = await compressImage(bannerFile, 5, 1200); // Max 5MB for committee
 const fileExt = compressedFile.name.split('.').pop();
 const fileName = `committee-${Date.now()}.${fileExt}`;
 await supabase.storage.from('nss-images').upload(fileName, compressedFile);
 imageUrl = supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl;
 }

 const memberData = { ...newMember, image_url: imageUrl };
 const { error } = await supabase.from('committee').insert([memberData]);
 if (error) throw error;

 toast.success("New Committee Member Added!");
 setNewMember({ name: '', designation: '', about: '' });
 setBannerFile(null);
 setShowAddForm(false);
 fetchMembers();
 } catch (err) { toast.error("Failed to add member."); } finally { setSaving(false); }
 };

 const openEditModal = (member) => {
 setEditFormData({ name: member.name, designation: member.designation, about: member.about || '' });
 setEditImageFile(null);
 setRemoveImage(false);
 setEditingMember(member);
 };

 const handleEditInputChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

 const handleUpdateMember = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 let updatedImageUrl = editingMember.image_url;
 if (removeImage && updatedImageUrl) {
 await deleteSupabaseImage(editingMember.image_url);
 updatedImageUrl = null;
 } else if (editImageFile) {
 if (editingMember.image_url) await deleteSupabaseImage(editingMember.image_url);
 const compressedFile = await compressImage(editImageFile, 5, 1200); // Max 5MB for committee
 const fileExt = compressedFile.name.split('.').pop();
 const fileName = `committee-edit-${Date.now()}.${fileExt}`;
 await supabase.storage.from('nss-images').upload(fileName, compressedFile);
 updatedImageUrl = supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl;
 }
 const finalUpdates = { ...editFormData, image_url: updatedImageUrl };
 const { error } = await supabase.from('committee').update(finalUpdates).eq('id', editingMember.id);
 if (error) throw error;

 toast.success("Profile Updated Successfully!");
 setEditingMember(null);
 fetchMembers();
 } catch (err) { toast.error("Failed to update profile."); } finally { setSaving(false); }
 };

 const handleDeleteMember = async (id) => {
 const confirmed = await confirm("Are you sure you want to remove this member?", { title:"Remove Member", type:"danger", confirmText:"Remove", cancelText:"Cancel" });
 if (!confirmed) return;
 const member = members.find(m => m.id === id);
 if (member) await deleteSupabaseImage(member.image_url);
 await supabase.from('committee').delete().eq('id', id);
 toast.success("Member removed successfully.");
 fetchMembers();
 };

 const PlusIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
 const EditIcon = () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
 const TrashIcon = () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

 return (
 <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8 border-b border-gray-100 pb-4">
 <div><h3 className="text-xl md:text-2xl font-bold text-gray-800">Committee Members</h3></div>
 <button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
 {showAddForm ? 'Cancel' : <><PlusIcon /> Add Member</>}
 </button>
 </div>

 {showAddForm && (
 <form onSubmit={handleAddMember} className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div><label className="text-sm font-semibold mb-1">Full Name *</label><input name="name" value={newMember.name} onChange={handleAddInputChange} required className="w-full p-2.5 border rounded-lg" /></div>
 <div><label className="text-sm font-semibold mb-1">Designation *</label><input name="designation" value={newMember.designation} onChange={handleAddInputChange} required className="w-full p-2.5 border rounded-lg" /></div>
 <div className="md:col-span-2"><label className="text-sm font-semibold mb-1">About *</label><textarea name="about" value={newMember.about} onChange={handleAddInputChange} required rows="3" className="w-full p-2.5 border rounded-lg"></textarea></div>
 <div className="md:col-span-2">
 <label className="block text-sm font-semibold mb-1 text-blue-700">Profile Picture (Optional)</label>
 <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-blue-200 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition text-sm font-semibold text-blue-600">
 {bannerFile ? bannerFile.name : '+ Click to Add Photo'}
 <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} className="hidden" />
 </label>
 </div>
 </div>
 <button type="submit" disabled={saving} className="mt-6 w-full text-white font-bold py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700">{saving ? 'Saving...' : 'Save Profile'}</button>
 </form>
 )}

 {loading ? <div className="text-center py-10">Loading...</div> : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {members.map((member) => (
 <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
 <div className="p-6 flex flex-col items-center text-center flex-1">
 {member.image_url ? (
 <img src={member.image_url} alt={member.name} className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-md mb-4 bg-slate-100" />
 ) : (
 <div className="w-28 h-28 rounded-full border-4 border-white shadow-md mb-4 bg-slate-100 flex items-center justify-center">
 <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
 </div>
 )}
 <h4 className="font-bold text-lg mb-1">{member.name}</h4>
 <p className="text-sm text-blue-600 font-semibold">{member.designation}</p>
 </div>
 <div className="flex border-t border-gray-100">
 <button onClick={() => openEditModal(member)} className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-blue-50 flex justify-center items-center"><EditIcon /> Edit</button>
 <div className="w-px bg-gray-100"></div>
 <button onClick={() => handleDeleteMember(member.id)} className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-red-50 flex justify-center items-center"><TrashIcon /> Delete</button>
 </div>
 </div>
 ))}
 </div>
 )}

 {editingMember && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in-up">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
 <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0 border-b-4 border-blue-500">
 <h3 className="font-bold flex items-center gap-2">Update Committee Member</h3>
 <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-white transition"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
 </div>
 <form onSubmit={handleUpdateMember} className="p-6 md:p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
 <div className="flex flex-col md:flex-row gap-6 mb-6">
 <div className="w-full md:w-1/3 flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
 <div className="relative mb-4">
 <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200 flex items-center justify-center">
 {editImageFile ? (
 <img src={URL.createObjectURL(editImageFile)} alt="New" className="w-full h-full object-cover" />
 ) : editingMember.image_url && !removeImage ? (
 <img src={editingMember.image_url} alt="Current" className="w-full h-full object-cover" />
 ) : (
 <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
 )}
 </div>
 </div>
 <label className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded cursor-pointer transition w-full text-center mb-2">
 {(editingMember.image_url || editImageFile) && !removeImage ? 'Change Photo' : 'Add Photo'}
 <input type="file" accept="image/*" className="hidden" onChange={(e) => { setEditImageFile(e.target.files[0]); setRemoveImage(false); }} />
 </label>
 {(editingMember.image_url || editImageFile) && !removeImage && (
 <button type="button" onClick={() => { setRemoveImage(true); setEditImageFile(null); }} className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded hover:bg-red-100 transition w-full text-center">Remove Photo</button>
 )}
 </div>
 <div className="flex-1 space-y-4">
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
 <input name="name" value={editFormData.name} onChange={handleEditInputChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. Dr. John Doe"/>
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1">Designation *</label>
 <input name="designation" value={editFormData.designation} onChange={handleEditInputChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. Program Officer"/>
 </div>
 </div>
 </div>
 <div className="mb-6">
 <label className="block text-xs font-bold text-gray-700 mb-1">About / Bio *</label>
 <textarea name="about" value={editFormData.about} onChange={handleEditInputChange} required rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Write a short bio..."></textarea>
 </div>
 <div className="flex gap-3 shrink-0 pt-4 border-t border-gray-200">
 <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm text-sm">Cancel</button>
 <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md text-sm">{saving ? 'Saving...' : 'Save Updates'}</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

// ============================================================================
// NAME TAG INPUT — Smart tag-based name entry with live count
// Usage: type a name, press Enter or comma to add; click × to remove
// ============================================================================
const NameTagInput = React.memo(({ label, tags, onChange, color = 'blue' }) => {
 const [inputVal, setInputVal] = React.useState('');

 const colorMap = {
 blue: { tag: 'bg-blue-100 text-blue-800 border-blue-200', badge: 'bg-blue-600', ring: 'focus:ring-blue-400', border: 'border-blue-300' },
 purple: { tag: 'bg-purple-100 text-purple-800 border-purple-200', badge: 'bg-purple-600', ring: 'focus:ring-purple-400', border: 'border-purple-300' },
 };
 const c = colorMap[color] || colorMap.blue;

 const addTag = (raw) => {
 const name = raw.trim().replace(/,+$/, '');
 if (!name) return;
 if (!tags.some(t => t.toLowerCase() === name.toLowerCase())) {
 onChange([...tags, name]);
 }
 setInputVal('');
 };

 const removeTag = (index) => onChange(tags.filter((_, i) => i !== index));

 const handleKeyDown = (e) => {
 if (e.key === 'Enter') { e.preventDefault(); addTag(inputVal); }
 if (e.key === ',') { e.preventDefault(); addTag(inputVal); }
 if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
 removeTag(tags.length - 1);
 }
 };

 const handleBlur = () => { if (inputVal.trim()) addTag(inputVal); };

 return (
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="text-xs font-bold text-gray-700">{label}</label>
 <span className={`text-white text-sm font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
 {tags.length} {tags.length === 1 ? 'person' : 'people'}
 </span>
 </div>

 <div
 className={`min-h-[56px] w-full p-2 border-2 rounded-xl bg-white flex flex-wrap gap-1.5 items-start focus-within:ring-2 transition ${c.border} ${c.ring}`}
 onClick={() => document.getElementById(`tag-input-${label}`)?.focus()}
 >
 {tags.map((tag, i) => (
 <span
 key={i}
 className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${c.tag}`}
 >
 {tag}
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); removeTag(i); }}
 className="ml-0.5 text-current opacity-60 hover:opacity-100 transition font-semibold leading-none"
 >
 ×
 </button>
 </span>
 ))}
 <input
 id={`tag-input-${label}`}
 type="text"
 value={inputVal}
 onChange={(e) => setInputVal(e.target.value)}
 onKeyDown={handleKeyDown}
 onBlur={handleBlur}
 placeholder={tags.length === 0 ? 'Type a name and press Enter or comma…' : 'Add another…'}
 className="flex-1 min-w-[160px] outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400 py-0.5"
 />
 </div>
 <p className="text-sm text-gray-400 mt-1">Press <kbd className="bg-gray-100 border border-gray-200 px-1 py-0.5 rounded text-sm font-mono">Enter</kbd> or <kbd className="bg-gray-100 border border-gray-200 px-1 py-0.5 rounded text-sm font-mono">,</kbd> to add · click <strong>×</strong> to remove</p>
 </div>
 );
});


// ============================================================================
// EVENT CARD — Memoized to prevent re-renders of the whole list
// ============================================================================
const EventCard = React.memo(({ evt, onEdit, onDelete, onView }) => {
 const getEventStatus = (start, end) => {
 const today = new Date(); today.setHours(0, 0, 0, 0);
 const startDate = new Date(start); startDate.setHours(0, 0, 0, 0);
 const endDate = new Date(end); endDate.setHours(0, 0, 0, 0);
 if (today < startDate) return { text: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
 else if (today > endDate) return { text: 'Past Event', color: 'bg-gray-100 text-gray-600' };
 else return { text: 'Current', color: 'bg-green-100 text-green-800 animate-pulse' };
 };

 const status = getEventStatus(evt.start_date, evt.end_date);

 return (
 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative group hover:shadow-md transition-shadow">
 <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold z-10 ${status.color}`}>{status.text}</div>
 <div className="relative h-48 w-full overflow-hidden">
 <img src={evt.banner_url} alt="Banner" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" onClick={() => onView(evt)} />
 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
 </div>
 <div className="p-5 flex flex-col flex-1">
 <h4 className="font-semibold text-slate-800 text-lg mb-1 line-clamp-1">{evt.title}</h4>
 <p className="text-sm text-slate-400 font-semibold mb-4 flex items-center gap-1.5">
 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
 {evt.start_date} — {evt.end_date}
 </p>
 <div className="mt-auto flex gap-2 w-full pt-4 border-t border-slate-50">
 <button onClick={() => onEdit(evt)} className="flex-[2] bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm py-2.5 rounded-xl hover:bg-blue-100 transition-colors">Edit Details</button>
 <button onClick={() => onDelete(evt.id)} className="flex-1 bg-red-50 text-red-600 font-bold text-xs sm:text-sm py-2.5 rounded-xl hover:bg-red-100 transition-colors">Delete</button>
 </div>
 </div>
 </div>
 );
});

// ============================================================================
const EventsManager = ({ setIsDirty }) => {
 const { toast, confirm } = useToast();
 const [events, setEvents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showAddForm, setShowAddForm] = useState(false);
 const [editingEvent, setEditingEvent] = useState(null);
 const [viewingEvent, setViewingEvent] = useState(null);
 const [saving, setSaving] = useState(false);

 const [addFormData, setAddFormData] = useState({ title: '', start_date: '', end_date: '' });
 const [bannerFile, setBannerFile] = useState(null);
 
 const [editFormData, setEditFormData] = useState({});
 const [editBannerFile, setEditBannerFile] = useState(null);
 const [galleryFiles, setGalleryFiles] = useState([]);

 // Tag arrays for name-based count fields
 const [teacherTags, setTeacherTags] = useState([]);
 const [volunteerTags, setVolunteerTags] = useState([]);

 // Helper: parse comma-separated string → clean array of names
 const parseTags = useCallback((str) =>
 (str || '').split(',').map(s => s.trim()).filter(Boolean), []);

 const [previews, setPreviews] = useState({ banner: null, gallery: [] });

 useEffect(() => {
 if (editBannerFile) {
 const url = URL.createObjectURL(editBannerFile);
 setPreviews(p => ({ ...p, banner: url }));
 return () => URL.revokeObjectURL(url);
 } else {
 setPreviews(p => ({ ...p, banner: null }));
 }
 }, [editBannerFile]);

 useEffect(() => {
 if (galleryFiles.length > 0) {
 const urls = galleryFiles.map(f => URL.createObjectURL(f));
 setPreviews(p => ({ ...p, gallery: urls }));
 return () => urls.forEach(u => URL.revokeObjectURL(u));
 } else {
 setPreviews(p => ({ ...p, gallery: [] }));
 }
 }, [galleryFiles]);


 useEffect(() => { setIsDirty(showAddForm || editingEvent !== null); }, [showAddForm, editingEvent, setIsDirty]);
 useEffect(() => { fetchEvents(); }, []);

 const fetchEvents = async () => {
 try {
 const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: false });
 if (error) throw error;
 setEvents(data || []);
 } catch (err) { console.error("Error fetching events:", err); } finally { setLoading(false); }
 };

 const getEventStatus = (start, end) => {
 const today = new Date(); today.setHours(0, 0, 0, 0);
 const startDate = new Date(start); startDate.setHours(0, 0, 0, 0);
 const endDate = new Date(end); endDate.setHours(0, 0, 0, 0);
 if (today < startDate) return { text: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
 else if (today > endDate) return { text: 'Past Event', color: 'bg-gray-100 text-gray-600' };
 else return { text: 'Current', color: 'bg-green-100 text-green-800 animate-pulse' };
 };

 const handleAddInputChange = (e) => setAddFormData({ ...addFormData, [e.target.name]: e.target.value });
 
 const handleAddEvent = async (e) => {
 e.preventDefault();
 if (!bannerFile) return toast.warning("Please upload a banner image.");
 setSaving(true);
 try {
 const compressedBanner = await compressImage(bannerFile, 6, 1920); // Max 6MB for events
 const bannerName = `banner-${Date.now()}.${compressedBanner.name.split('.').pop()}`;
 await supabase.storage.from('nss-images').upload(bannerName, compressedBanner);
 const bannerUrl = supabase.storage.from('nss-images').getPublicUrl(bannerName).data.publicUrl;

 const newEvent = { ...addFormData, banner_url: bannerUrl };
 await supabase.from('events').insert([newEvent]);
 toast.success("Event Created Successfully!");
 setAddFormData({ title: '', start_date: '', end_date: '' }); setBannerFile(null); setShowAddForm(false);
 fetchEvents();
 } catch (err) { toast.error("Failed to create event."); } finally { setSaving(false); }
 };

 const openEditModal = (evt) => {
 setEditFormData({ title: evt.title, start_date: evt.start_date, end_date: evt.end_date, description: evt.description || '' });
 setTeacherTags(parseTags(evt.teachers_present));
 setVolunteerTags(parseTags(evt.volunteers_present));
 setGalleryFiles([]); setEditBannerFile(null); setEditingEvent(evt);
 };

 const handleEditInputChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

 const handleUpdateEvent = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 let updatedBannerUrl = editingEvent.banner_url;
 if (editBannerFile) {
 await deleteSupabaseImage(editingEvent.banner_url);
 const compressedBanner = await compressImage(editBannerFile, 6, 1920); // Max 6MB for events
 const bannerName = `banner-edit-${Date.now()}.${compressedBanner.name.split('.').pop()}`;
 await supabase.storage.from('nss-images').upload(bannerName, compressedBanner);
 updatedBannerUrl = supabase.storage.from('nss-images').getPublicUrl(bannerName).data.publicUrl;
 }

 let updatedGalleryUrls = editingEvent.gallery_urls || [];
 if (galleryFiles.length > 0) {
 if (galleryFiles.length + updatedGalleryUrls.length > 5) return toast.warning("Max 5 gallery images allowed.");
 for (let i = 0; i < galleryFiles.length; i++) {
 const compressedFile = await compressImage(galleryFiles[i], 6, 1920); // Max 6MB for events gallery
 const fileName = `gallery-${Date.now()}-${i}.${compressedFile.name.split('.').pop()}`;
 await supabase.storage.from('nss-images').upload(fileName, compressedFile);
 updatedGalleryUrls.push(supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl);
 }
 }

 // Serialize tag arrays back to comma-separated strings
 const finalUpdates = {
 ...editFormData,
 banner_url: updatedBannerUrl,
 gallery_urls: updatedGalleryUrls,
 teachers_present: teacherTags.join(', '),
 volunteers_present: volunteerTags.join(', '),
 };
 await supabase.from('events').update(finalUpdates).eq('id', editingEvent.id);
 toast.success("Event Updated!");
 setEditingEvent(null); fetchEvents();
 } catch (err) { toast.error("Failed to update event."); } finally { setSaving(false); }
 };

 const handleDeleteEvent = async (id) => {
 const confirmed = await confirm("Delete this event and all its images permanently?", { title:"Delete Event", type:"danger", confirmText:"Delete", cancelText:"Cancel" });
 if (!confirmed) return;
 const evt = events.find(e => e.id === id);
 if (evt) {
 await deleteSupabaseImage(evt.banner_url);
 if (evt.gallery_urls) {
 for (let url of evt.gallery_urls) await deleteSupabaseImage(url);
 }
 }
 await supabase.from('events').delete().eq('id', id);
 toast.success("Event deleted successfully.");
 fetchEvents();
 };

 const handleClearGallery = async () => {
 const confirmed = await confirm("Delete all gallery images for this event?", { title:"Clear Gallery", type:"danger", confirmText:"Clear All", cancelText:"Cancel" });
 if (!confirmed) return;
 for (let url of editingEvent.gallery_urls || []) await deleteSupabaseImage(url);
 await supabase.from('events').update({ gallery_urls: [] }).eq('id', editingEvent.id);
 setEditingEvent({...editingEvent, gallery_urls: []});
 toast.success("Gallery cleared!");
 };

 const removeNewGalleryImage = (indexToRemove) => {
 setGalleryFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
 };

 const removeOldGalleryImage = async (indexToRemove) => {
 const confirmed = await confirm("Remove this image from the gallery?", { title:"Remove Image", type:"danger", confirmText:"Remove", cancelText:"Cancel" });
 if (!confirmed) return;
 const urlToRemove = editingEvent.gallery_urls[indexToRemove];
 const updatedUrls = editingEvent.gallery_urls.filter((_, idx) => idx !== indexToRemove);
 setEditingEvent({ ...editingEvent, gallery_urls: updatedUrls });
 await deleteSupabaseImage(urlToRemove);
 await supabase.from('events').update({ gallery_urls: updatedUrls }).eq('id', editingEvent.id);
 toast.success("Image removed!");
 };

 return (
 <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
 <div className="flex flex-col sm:flex-row justify-between mb-8 border-b pb-4">
 <h3 className="text-2xl font-bold text-gray-800">Manage Events</h3>
 <button onClick={() => setShowAddForm(!showAddForm)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold">
 {showAddForm ? 'Cancel Creation' : 'Create New Event'}
 </button>
 </div>

 {showAddForm && (
 <form onSubmit={handleAddEvent} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl mb-10 border border-slate-200 shadow-xl animate-fade-in-up">
 <div className="flex items-center gap-4 mb-8">
 <div className="w-12 h-12 rounded-2xl bg-green-600/10 border border-green-500/20 flex items-center justify-center">
 <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
 </div>
 <div>
 <h3 className="text-xl font-semibold text-slate-900">Create New Event</h3>
 <p className="text-xs text-slate-500 font-bold mt-0.5">Initialize a new activity</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-semibold text-slate-400 mb-1.5 ml-1">Event Title</label>
 <input name="title" value={addFormData.title} onChange={handleAddInputChange} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400" placeholder="e.g. Annual Blood Donation Camp" />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="block text-sm font-semibold text-slate-400 ml-1">Start Date</label>
 <div className="relative date-input-wrapper">
 <input type="date" name="start_date" value={addFormData.start_date} onChange={handleAddInputChange} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-green-500 outline-none font-bold text-slate-700" />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="block text-sm font-semibold text-slate-400 ml-1">End Date</label>
 <div className="relative date-input-wrapper">
 <input type="date" name="end_date" value={addFormData.end_date} onChange={handleAddInputChange} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-green-500 outline-none font-bold text-slate-700" />
 </div>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-400 mb-1.5 ml-1">Event Banner</label>
 <label className={`flex flex-col items-center justify-center w-full aspect-[21/9] border-2 border-dashed rounded-3xl cursor-pointer transition-all ${bannerFile ? 'border-green-500 bg-green-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}>
 {bannerFile ? (
 <div className="flex flex-col items-center text-green-700">
 <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
 <span className="text-sm font-semibold truncate max-w-[200px]">{bannerFile.name}</span>
 <span className="text-sm font-bold mt-1 opacity-60">Click to change</span>
 </div>
 ) : (
 <div className="flex flex-col items-center text-slate-400">
 <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
 <span className="text-xs font-semibold">Select Banner</span>
 </div>
 )}
 <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} required className="hidden" />
 </label>
 </div>
 </div>

 <div className="flex gap-4">
 <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all text-sm md:text-base">Cancel</button>
 <button type="submit" disabled={saving} className="flex-[3] py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-2xl shadow-xl shadow-green-600/20 transition-all active:scale-[0.98] text-sm md:text-base flex items-center justify-center gap-2">
 {saving ? 'Creating Event...' : 'Create Event'}
 </button>
 </div>
 </form>
 )}

 {loading ? <div className="text-center py-20 flex flex-col items-center gap-4">
 <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
 <p className="text-slate-400 font-semibold text-xs">Loading Events...</p>
 </div> : (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
 {events.map(evt => (
 <EventCard 
 key={evt.id} 
 evt={evt} 
 onEdit={openEditModal} 
 onDelete={handleDeleteEvent} 
 onView={setViewingEvent} 
 />
 ))}
 </div>
 )}

 {editingEvent && (
 <div className="fixed inset-0 z-[100]">
 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-backdrop-in" onClick={() => setEditingEvent(null)} />
 <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8 md:p-12 flex items-start justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
 <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl my-auto border border-slate-200 overflow-hidden animate-fade-in-up">
 {/* Modal Header */}
 <div className="px-4 sm:px-6 py-4 bg-white text-slate-800 flex justify-between items-center shrink-0 border-b border-slate-100">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
 <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
 </div>
 <div>
 <h3 className="text-xl font-semibold">Redesign Event</h3>
 <p className="text-xs text-slate-500 font-medium mt-0.5">Quick Editor Mode</p>
 </div>
 </div>
 <button type="button" onClick={() => setEditingEvent(null)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors group">
 <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>

 <form onSubmit={handleUpdateEvent} className="p-4 sm:p-6 md:p-8 bg-gray-50/50 rounded-b-2xl sm:rounded-b-3xl">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Left Column: Basic Info */}
 <div className="space-y-6">
 <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
 <label className="block text-sm font-semibold text-slate-500 mb-3 px-1">Basic Details</label>
 <div className="space-y-4">
 <div>
 <input name="title" value={editFormData.title} onChange={handleEditInputChange} required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800" placeholder="Event Title" />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="px-1.5 text-sm font-semibold text-blue-600">Start Date</label>
 <div className="relative date-input-wrapper">
 <input type="date" name="start_date" value={editFormData.start_date} onChange={handleEditInputChange} required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700" />
 </div>
 </div>
 <div className="space-y-1">
 <label className="px-1.5 text-sm font-semibold text-red-600">End Date</label>
 <div className="relative date-input-wrapper">
 <input type="date" name="end_date" value={editFormData.end_date} onChange={handleEditInputChange} required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700" />
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
 <label className="block text-sm font-semibold text-slate-500 mb-2 px-1">Report Description</label>
 <textarea name="description" value={editFormData.description} onChange={handleEditInputChange} rows="6" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 resize-none" placeholder="Detailed event report..." />
 </div>
 </div>

 {/* Right Column: Visuals & Tags */}
 <div className="space-y-6">
 {/* Banner Upload */}
 <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
 <label className="block text-sm font-semibold text-slate-500 mb-2 px-1">Event Banner</label>
 <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 border-2 border-dashed border-slate-200 mb-1">
 {previews.banner ? (
 <img src={previews.banner} alt="New Banner" className="w-full h-full object-cover" />
 ) : editingEvent.banner_url ? (
 <img src={editingEvent.banner_url} alt="Current Banner" className="w-full h-full object-cover" />
 ) : (
 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
 <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
 <span className="text-xs font-bold">No Banner Selected</span>
 </div>
 )}
 <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm">
 <svg className="w-8 h-8 text-white mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
 <span className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">Tap to change</span>
 <input type="file" accept="image/*" onChange={(e) => setEditBannerFile(e.target.files[0])} className="hidden"/>
 </label>
 </div>
 </div>

 {/* Smart Tag Inputs */}
 <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-5">
 <NameTagInput label="Teachers Present" tags={teacherTags} onChange={setTeacherTags} color="purple" />
 <NameTagInput label="Volunteers Present" tags={volunteerTags} onChange={setVolunteerTags} color="blue" />
 </div>
 </div>
 </div>

 {/* Gallery Section */}
 <div className="mt-8 bg-white p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h4 className="text-lg font-semibold text-slate-900">Event Gallery</h4>
 <p className="text-xs text-slate-500 font-bold">Max 5 high-quality images</p>
 </div>
 {(editingEvent.gallery_urls?.length > 0) && (
 <button type="button" onClick={handleClearGallery} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-semibold text-sm transition-colors">Wipe Gallery</button>
 )}
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
 {editingEvent.gallery_urls?.map((url, i) => (
 <div key={`old-${i}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
 <img src={url} alt="Gallery" className="w-full h-full object-cover" />
 <button type="button" onClick={() => removeOldGalleryImage(i)} className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md z-10" title="Remove from database">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>
 ))}
 {previews.gallery.map((url, i) => (
 <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-blue-400 shadow-sm ring-2 ring-blue-100 group">
 <img src={url} alt="New Gallery" className="w-full h-full object-cover" />
 <button type="button" onClick={() => removeNewGalleryImage(i)} className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md z-10" title="Remove image">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>
 ))}
 { (editingEvent.gallery_urls?.length || 0) + galleryFiles.length < 5 && (
 <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors group">
 <svg className="w-8 h-8 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
 <input type="file" accept="image/*" multiple onChange={(e) => {
  const newFiles = Array.from(e.target.files);
  const currentCount = (editingEvent.gallery_urls?.length || 0) + galleryFiles.length;
  if (currentCount + newFiles.length > 5) {
    toast.warning("You can only have a maximum of 5 images total.");
    setGalleryFiles(prev => [...prev, ...newFiles.slice(0, 5 - currentCount)]);
  } else {
    setGalleryFiles(prev => [...prev, ...newFiles]);
  }
}} className="hidden" />
 </label>
 )}
 </div>
 </div>
 {/* Action Buttons */}
 <div className="mt-10 flex gap-4">
 <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all active:scale-[0.98] text-sm md:text-base">Discard</button>
 <button type="submit" disabled={saving} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] text-sm md:text-base flex items-center justify-center gap-2">
 {saving ? (
 <>
 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
 Publishing Changes...
 </>
 ) : (
 'Update Event'
 )}
 </button>
 </div>
 </form>
 </div>
  </div>
 </div>
 )}

 </div>
 );
};

// ============================================================================
// SECTION 4: SITE SETTINGS MANAGER
// ============================================================================
const SettingsManager = ({ isDirty, setIsDirty }) => { // Note: isDirty is now passed down
 const { toast } = useToast();
 const [siteData, setSiteData] = useState({ hero_title: '', hero_subtitle: '', about_heading: '', about_text: '', about_image_url: '', hero_slider_urls: [], contact_email: '', contact_phone: '', contact_whatsapp: '', social_facebook: '', social_instagram: '', social_youtube: '' });
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 
 const [aboutSlots, setAboutSlots] = useState([]);
 const [sliderSlots, setSliderSlots] = useState([]);

 // Icons for this component
 const Icons = {
 Hero: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
 About: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
 Contact: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
 Plus: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>,
 Change: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
 Remove: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
 Publish: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
 Email: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
 Phone: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
 Facebook: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>,
 Instagram: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>,
 Youtube: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.13 1 12 1 12s0 3.87.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.87 23 12 23 12s0-3.87-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>,
 };

 const handleChange = (e) => { setIsDirty(true); setSiteData({ ...siteData, [e.target.name]: e.target.value }); };

 const handleAboutSlotChange = (index, file) => {
 if (!file) return; setIsDirty(true);
 const newSlotData = { isNew: true, file: file, preview: URL.createObjectURL(file) };
 const updatedSlots = [...aboutSlots]; updatedSlots[index] = newSlotData; setAboutSlots(updatedSlots.filter(Boolean));
 };

 const handleAboutSlotRemove = (index) => {
 setIsDirty(true);
 const slotToRemove = aboutSlots[index];
 if (slotToRemove && slotToRemove.isNew) URL.revokeObjectURL(slotToRemove.preview);
 const updatedSlots = aboutSlots.filter((_, i) => i !== index);
 setAboutSlots(updatedSlots);
 };

 const handleSlotChange = (index, file) => {
 if (!file) return;
 setIsDirty(true);
 const newSlotData = { isNew: true, file: file, preview: URL.createObjectURL(file) };
 const updatedSlots = [...sliderSlots]; updatedSlots[index] = newSlotData; setSliderSlots(updatedSlots.filter(Boolean));
 };

 const handleSlotRemove = (index) => {
 setIsDirty(true);
 const slotToRemove = sliderSlots[index];
 if (slotToRemove.isNew) URL.revokeObjectURL(slotToRemove.preview);
 const updatedSlots = sliderSlots.filter((_, i) => i !== index);
 setSliderSlots(updatedSlots);
 };

 useEffect(() => {
 const fetchData = async () => {
 try {
 const { data, error } = await supabase.from('site_content').select('*').limit(1).single();
 if (error && error.code !== 'PGRST116') throw error;
 if (data) {
 setSiteData(data);
 setSliderSlots((data.hero_slider_urls || []).map(url => ({ isNew: false, file: null, preview: url })));
 setAboutSlots((data.about_image_url ? data.about_image_url.split(',').filter(Boolean) : []).map(url => ({ isNew: false, file: null, preview: url })));
 }
 } catch (err) { console.error(err); } finally { setLoading(false); }
 };
 fetchData();
 }, []);

 const handleUpdate = async (e) => {
 e.preventDefault(); setSaving(true);
 try {
 const originalAboutUrls = siteData.about_image_url ? siteData.about_image_url.split(',').filter(Boolean) : [];
 const keptAboutUrls = aboutSlots.filter(s => !s.isNew).map(s => s.preview);
 const aboutUrlsToDelete = originalAboutUrls.filter(url => !keptAboutUrls.includes(url));
 for (let url of aboutUrlsToDelete) await deleteSupabaseImage(url);

 let finalAboutUrls = [];
 for (let slot of aboutSlots) {
 if (slot.isNew && slot.file) {
 const compressedFile = await compressImage(slot.file, 6, 1920); // Max 6MB for about section
 const fileName = `about-${Date.now()}-${Math.floor(Math.random()*1000)}.${compressedFile.name.split('.').pop()}`;
 await supabase.storage.from('nss-images').upload(fileName, compressedFile);
 finalAboutUrls.push(supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl);
 } else { finalAboutUrls.push(slot.preview); }
 }
 const updatedAboutImageUrl = finalAboutUrls.join(',');

 const originalUrls = siteData.hero_slider_urls || [];
 const keptUrls = sliderSlots.filter(s => !s.isNew).map(s => s.preview);
 const urlsToDelete = originalUrls.filter(url => !keptUrls.includes(url));
 
 for (let url of urlsToDelete) await deleteSupabaseImage(url);

 let finalSliderUrls = [];
 for (let slot of sliderSlots) {
 if (slot.isNew && slot.file) {
 const compressedSlotFile = await compressImage(slot.file, 6, 1920); // Max 6MB for hero slider
 const fileName = `slider-${Date.now()}-${Math.floor(Math.random()*1000)}.${compressedSlotFile.name.split('.').pop()}`;
 await supabase.storage.from('nss-images').upload(fileName, compressedSlotFile);
 finalSliderUrls.push(supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl);
 } else { finalSliderUrls.push(slot.preview); }
 }

 const finalData = { ...siteData, about_image_url: updatedAboutImageUrl, hero_slider_urls: finalSliderUrls };
 if (siteData.id) await supabase.from('site_content').update(finalData).eq('id', siteData.id);
 else await supabase.from('site_content').insert([finalData]);

 toast.success("Settings Updated!"); setIsDirty(false); setSiteData(finalData);
 setSliderSlots(finalSliderUrls.map(url => ({ isNew: false, file: null, preview: url })));
 setAboutSlots(finalAboutUrls.map(url => ({ isNew: false, file: null, preview: url })));
 } catch (err) { toast.error("Failed to update settings."); } finally { setSaving(false); }
 };

 // Reusable Image Slot Component
 const ImageSlot = ({ slot, onRemove, onChange, emptyText ="Add Image" }) => (
 <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-gray-300 aspect-video bg-gray-50">
 {slot ? (
 <>
 <img src={slot.preview} className="w-full h-full object-cover" alt="Preview" />
 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
 <label className="p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer backdrop-blur-sm" title="Change Image">
 <Icons.Change />
 <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files[0])} />
 </label>
 <button type="button" onClick={onRemove} className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 backdrop-blur-sm" title="Remove Image">
 <Icons.Remove />
 </button>
 </div>
 </>
 ) : (
 <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 text-gray-400 transition-colors group">
 <Icons.Plus />
 <span className="text-xs font-semibold mt-1 group-hover:text-blue-600">{emptyText}</span>
 <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files[0])} />
 </label>
 )}
 </div>
 );

 if (loading) return <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading settings...</div>;

 return (
 <form onSubmit={handleUpdate}>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
 <div className="lg:col-span-2 space-y-8">
 {/* Hero Section Card */}
 <div className="bg-purple-50/60 p-6 rounded-2xl shadow-sm border border-purple-100">
 <h4 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2"><Icons.Hero /> Hero Section</h4>
 <div className="space-y-4">
 <textarea name="hero_title" value={siteData.hero_title || ''} onChange={handleChange} rows="2" className="w-full p-2.5 border rounded-lg" placeholder="Hero Title (supports line breaks)"></textarea>
 <input name="hero_subtitle" value={siteData.hero_subtitle || ''} onChange={handleChange} className="w-full p-2.5 border rounded-lg" placeholder="Hero Subtitle" />
 <div>
 <label className="block text-sm font-semibold text-purple-800 mb-2">Slideshow Images (Max 5)</label>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
 {[...Array(5)].map((_, index) => (
 <ImageSlot key={index} slot={sliderSlots[index]} onRemove={() => handleSlotRemove(index)} onChange={(file) => handleSlotChange(index, file)} emptyText="Add Slide" />
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* About Section Card */}
 <div className="bg-blue-50/60 p-6 rounded-2xl shadow-sm border border-blue-100">
 <h4 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2"><Icons.About /> About Section</h4>
 <div className="space-y-4">
 <input name="about_heading" value={siteData.about_heading || ''} onChange={handleChange} className="w-full p-2.5 border rounded-lg" placeholder="About Heading" />
 <textarea name="about_text" value={siteData.about_text || ''} onChange={handleChange} rows="4" className="w-full p-2.5 border rounded-lg" placeholder="About Text"></textarea>
 <div>
 <label className="block text-sm font-semibold text-blue-800 mb-2">About Images (Max 3)</label>
 <div className="grid grid-cols-3 gap-3">
 {[...Array(3)].map((_, index) => (
 <ImageSlot key={index} slot={aboutSlots[index]} onRemove={() => handleAboutSlotRemove(index)} onChange={(file) => handleAboutSlotChange(index, file)} />
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Contact & Socials Card */}
 <div className="bg-indigo-50/60 p-6 rounded-2xl shadow-sm border border-indigo-100">
 <h4 className="font-bold text-lg text-indigo-900 mb-4 flex items-center gap-2"><Icons.Contact /> Contact & Socials</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {[
 { name: 'contact_email', placeholder: 'nss@example.com', icon: <Icons.Email /> },
 { name: 'contact_phone', placeholder: '+91 9876543210', icon: <Icons.Phone /> },
 { name: 'contact_whatsapp', placeholder: '+91 9876543210', icon: <Icons.Phone /> },
 { name: 'social_facebook', placeholder: 'https://facebook.com/...', icon: <Icons.Facebook /> },
 { name: 'social_instagram', placeholder: 'https://instagram.com/...', icon: <Icons.Instagram /> },
 { name: 'social_youtube', placeholder: 'https://youtube.com/...', icon: <Icons.Youtube /> },
 ].map(field => (
 <div key={field.name} className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{field.icon}</div>
 <input
 name={field.name}
 value={siteData[field.name] || ''}
 onChange={handleChange}
 className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
 placeholder={field.placeholder}
 />
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Sticky Publish Card */}
 <div className="lg:col-span-1 lg:sticky lg:top-8">
 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
 <h4 className="font-bold text-gray-800 mb-2">Publish</h4>
 <p className="text-sm text-gray-500 mb-6">
 {isDirty ?"You have unsaved changes. Click the button below to make them live." :"No changes to publish. Edit a field to enable publishing."}
 </p>
 <button
 type="submit"
 disabled={!isDirty || saving}
 className={`w-full text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg text-base flex items-center justify-center gap-2 ${
 !isDirty || saving
 ? 'bg-gray-400 cursor-not-allowed'
 : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5'
 }`}
 >
 <Icons.Publish />
 {saving ? 'Publishing...' : 'Publish Changes'}
 </button>
 </div>
 </div>
 </div>
 </form>
 );
};


// ICONS

const SidebarIcons = {
 Volunteers: () => <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
 Events: () => <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
 Committee: () => <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
 Settings: () => <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
 Logout: () => <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
 Public: () => <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
 Menu: () => <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>,
 Close: () => <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
};

const CustomScrollbarStyles = () => (
 <style>{`
 /* Premium Smart Scrollbar */
 .main-scroll, .sidebar-scroll {
 scrollbar-width: thin;
 scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
 }

 /* Webkit (Chrome/Safari/Edge) */
 .no-scrollbar::-webkit-scrollbar {
 width: 4px;
 height: 4px;
 }
 .no-scrollbar::-webkit-scrollbar-track {
 background: transparent;
 }
 .no-scrollbar::-webkit-scrollbar-thumb {
 background: rgba(0, 0, 0, 0); /* Start invisible */
 border-radius: 20px;
 transition: background 0.3s ease;
 }
 
 /* Show only on hover or active scroll */
 .no-scrollbar:hover::-webkit-scrollbar-thumb,
 .no-scrollbar:active::-webkit-scrollbar-thumb {
 background: rgba(0, 0, 0, 0.15);
 }
 
 .sidebar-scroll::-webkit-scrollbar-thumb {
 background: rgba(255, 255, 255, 0);
 }
 .sidebar-scroll:hover::-webkit-scrollbar-thumb {
 background: rgba(255, 255, 255, 0.1);
 }

 @keyframes fade-in-up { 
 from { opacity: 0; transform: translateY(24px) scale(0.98); } 
 to { opacity: 1; transform: translateY(0) scale(1); } 
 } 
 .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
 
 @keyframes backdrop-in {
 from { opacity: 0; backdrop-filter: blur(0px); }
 to { opacity: 1; backdrop-filter: blur(8px); }
 }
 .animate-backdrop-in { animation: backdrop-in 0.3s ease-out forwards; }

 /* Modern Date Input Customization */
 input[type="date"]::-webkit-calendar-picker-indicator {
 background: transparent;
 bottom: 0;
 color: transparent;
 cursor: pointer;
 height: auto;
 left: 0;
 position: absolute;
 right: 0;
 top: 0;
 width: auto;
 }
 input[type="date"] {
 position: relative;
 }
 .date-input-wrapper::after {
 content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E");
 position: absolute;
 right: 14px;
 top: 50%;
 transform: translateY(-50%);
 width: 18px;
 height: 18px;
 pointer-events: none;
 opacity: 0.6;
 transition: opacity 0.2s;
 }
 .date-input-wrapper:focus-within::after {
 opacity: 1;
 stroke: #2563eb;
 }
 `}</style>
);




// MAIN DASHBOARD COMPONENT - RECOMPILED
export default function AdminDashboard() {
 const router = useRouter();
 const { toast, confirm } = useToast();
 const [activeTab, setActiveTab] = useState('volunteers');
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [isDirty, setIsDirty] = useState(false);
 const [adminUser, setAdminUser] = useState(null);

 // Refs for logic
 const activeTabRef = useRef(activeTab); 
 useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
 const isDirtyRef = useRef(isDirty); 
 useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);


 // Warning Modal State
 const [warningModal, setWarningModal] = useState({ show: false, title: '', message: '', onConfirm: null });


 useEffect(() => {
 supabase.auth.getUser().then(async ({ data: { user } }) => {
 if (user) {
 const { data: adminData } = await supabase.from('admins').select('email').eq('email', user.email).single();
 if (adminData) setAdminUser(user);
 }
 });

 // Handle back button / page navigation traps
 window.history.pushState({ adminTrap: true }, '');
 const handlePopState = (e) => {
 window.history.pushState({ adminTrap: true }, '');
 if (isDirtyRef.current) {
 setWarningModal({
 show: true,
 title: 'Unsaved Changes',
 message: 'You have unsaved changes. Navigating back will discard them. Are you sure?',
 onConfirm: () => { setIsDirty(false); setActiveTab('volunteers'); setWarningModal({ show: false }); }
 });
 } else {
 if (activeTabRef.current !== 'volunteers') setActiveTab('volunteers');
 else {
 setWarningModal({
 show: true,
 title: 'Exit Admin Panel?',
 message: 'You are about to exit the admin dashboard. Any unsaved progress will be lost.',
 onConfirm: () => { window.location.replace('/'); }
 });
 }
 }
 };
 window.addEventListener('popstate', handlePopState);
 
 // Customize beforeunload (browser limitation: cannot change text but can trigger)
 const handleBeforeUnload = (e) => { 
 if (isDirtyRef.current) { 
 e.preventDefault(); 
 e.returnValue = 'Changes you made may not be saved.'; 
 } 
 };
 window.addEventListener('beforeunload', handleBeforeUnload);
 return () => { 
 window.removeEventListener('popstate', handlePopState); 
 window.removeEventListener('beforeunload', handleBeforeUnload); 
 };
 }, []);


 const handleTabChange = async (tabId) => {
 if (isDirty) {
 const confirmed = await confirm("You have unsaved changes. Discard them?", { title:"Discard Changes", type:"danger", confirmText:"Discard", cancelText:"Keep Editing" });
 if (!confirmed) return;
 }
 setIsDirty(false); setActiveTab(tabId); setIsMobileMenuOpen(false);
 };
 
 const handleLogout = async () => {
 if (isDirty) {
 const confirmed = await confirm("You have unsaved changes. Discard them and logout?", { title:"Logout", type:"danger", confirmText:"Logout", cancelText:"Stay Logged In" });
 if (!confirmed) return;
 }
 sessionStorage.removeItem('allow_public');
 supabase.auth.signOut().then(() => { router.push('/'); });
 };
 
 const handleGoToPublicSite = async () => {
 if (isDirty) {
 const confirmed = await confirm("Discard changes and return to the public site?", { title:"Leave Dashboard", type:"danger", confirmText:"Leave", cancelText:"Stay" });
 if (!confirmed) return;
 }
 sessionStorage.setItem('allow_public', 'true'); 
 router.push('/');
 };


 return (
 <div className="flex h-[100dvh] w-full overflow-hidden bg-gray-50 font-sans relative">
 <CustomScrollbarStyles />
 {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

 {warningModal.show && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-backdrop-in">
 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setWarningModal({ ...warningModal, show: false })} />
 <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-fade-in-up">
 <div className="h-2 w-full bg-gradient-to-r from-red-500 to-orange-500" />
 <div className="p-8 text-center">
 <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
 </div>
 <h3 className="text-2xl font-semibold text-slate-900 mb-3">{warningModal.title}</h3>
 <p className="text-slate-500 font-medium leading-relaxed mb-8">{warningModal.message}</p>
 <div className="flex gap-3">
 <button onClick={() => setWarningModal({ ...warningModal, show: false })} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98]">Cancel</button>
 <button onClick={warningModal.onConfirm} className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]">Confirm</button>
 </div>
 </div>
 </div>
 </div>
 )}


 <aside className={`absolute md:relative inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
 <div className="p-6 border-b border-slate-800"><h2 className="text-2xl font-bold text-blue-500">NSS Admin</h2></div>
 <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar sidebar-scroll">

 <button onClick={() => handleTabChange('volunteers')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold ${activeTab === 'volunteers' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}><SidebarIcons.Volunteers /> Volunteers</button>
 <button onClick={() => handleTabChange('events')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold ${activeTab === 'events' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}><SidebarIcons.Events /> Events</button>
 <button onClick={() => handleTabChange('committee')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold ${activeTab === 'committee' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}><SidebarIcons.Committee /> Committee</button>
 <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold ${activeTab === 'settings' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}><SidebarIcons.Settings /> Site Settings</button>
 </nav>
 <div className="p-4 border-t border-slate-800">
 {adminUser && (
 <div className="flex items-center gap-3 mb-4 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 shadow-inner">
 <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
 <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
 </div>
 <div className="overflow-hidden flex-1">
 <p className="text-sm font-bold text-white truncate">Administrator</p>
 <p className="text-xs text-slate-400 truncate" title={adminUser.email}>{adminUser.email}</p>
 </div>
 </div>
 )}
 <div className="space-y-2.5">
 <button onClick={handleGoToPublicSite} className="w-full flex justify-center items-center gap-2 text-blue-400 font-bold py-2.5 bg-blue-900/30 hover:bg-blue-900/50 transition rounded-xl text-sm"><SidebarIcons.Public /> Return to Site</button>
 <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-red-400 font-bold py-2.5 bg-red-900/20 hover:bg-red-900/40 transition rounded-xl text-sm"><SidebarIcons.Logout /> Logout</button>
 </div>
 </div>
 </aside>

 <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100">
 <header className="bg-white shadow-sm p-4 md:px-8 flex items-center gap-4"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden"><SidebarIcons.Menu /></button><h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1></header>
 <div className="flex-1 overflow-y-auto no-scrollbar main-scroll p-4 md:p-6 lg:p-8">
<div className="max-w-7xl mx-auto">
 {activeTab === 'volunteers' && <VolunteersManager setIsDirty={setIsDirty} />}
 {activeTab === 'events' && <EventsManager setIsDirty={setIsDirty} />}
 {activeTab === 'committee' && <CommitteeManager setIsDirty={setIsDirty} />}
 {activeTab === 'settings' && <SettingsManager isDirty={isDirty} setIsDirty={setIsDirty} />}
 </div></div>
 </main>
 </div>
 );
}

