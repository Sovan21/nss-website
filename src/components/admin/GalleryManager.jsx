"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate, getDirectImageUrl, compressImage, getAdminAuthToken } from '@/lib/utils';
import useScrollLock from '@/lib/useScrollLock';

const GalleryManager = ({ setIsDirty }) => {
  const { toast, confirm } = useToast();
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  // Multi-file batch state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formDate, setFormDate] = useState(getTodayDate());

  useScrollLock(showAddModal || editingItem !== null || viewingItem !== null);

  useEffect(() => {
    setIsDirty(showAddModal || editingItem !== null);
  }, [showAddModal, editingItem, setIsDirty]);

  const getAuthToken = async () => {
    return await getAdminAuthToken();
  };

  const fetchGallery = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase.from('nss_gallery').select('*').order('date', { ascending: false });
      if (error) {
        const fallback = await supabase.from('gallery').select('*').order('date', { ascending: false });
        if (!fallback.error) {
          data = fallback.data;
        }
      }
      setGallery(data || []);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      toast.error('Failed to load gallery photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // Handle multi-file selection
  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(newPreviews);
  };

  const removeFileAt = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);

    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
    }
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setFilePreviews(updatedPreviews);
  };

  const openCreateModal = () => {
    setFormDate(getTodayDate());
    setSelectedFiles([]);
    setFilePreviews([]);
    setEditingItem(null);
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormDate(item.date ? item.date.split('T')[0] : getTodayDate());
  };

  const closeModal = () => {
    filePreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setFilePreviews([]);
    setShowAddModal(false);
    setEditingItem(null);
    setUploadProgress(0);
  };

  // Submit Batch Upload (Date + Files only)
  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (!formDate) {
      toast.error('Please select a date');
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error('Please select at least 1 photo to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(5);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      let successfulCount = 0;
      const totalFiles = selectedFiles.length;

      // Upload files individually with automatic client-side compression to prevent 413 Payload Too Large
      for (let i = 0; i < totalFiles; i++) {
        let file = selectedFiles[i];

        // Automatically compress only if file exceeds 4.8MB, keeping target at 4.0 - 4.8MB in Ultra HD (4K 3840px)
        if (file && file.type && file.type.startsWith('image/') && file.size > 4.8 * 1024 * 1024) {
          try {
            file = await compressImage(file, 3800, 4800, 3840);
          } catch (compErr) {
            console.warn("Auto-compression skipped:", compErr);
          }
        }

        const data = new FormData();
        data.append('date', formDate);
        data.append('title', 'NSS Photo');
        data.append('files', file);

        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: data
        });

        if (!res.ok) {
          let errDetail = '';
          try {
            const errJson = await res.json();
            errDetail = errJson.error;
          } catch (e) {
            if (res.status === 413) {
              errDetail = `Photo "${file.name}" is too large (> 5MB). Please compress it.`;
            } else {
              errDetail = `Server returned HTTP ${res.status}: Upload failed`;
            }
          }
          throw new Error(errDetail || `Failed to upload photo ${i + 1}`);
        }

        successfulCount++;
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      toast.success(`Successfully uploaded ${successfulCount} photo(s)!`);
      closeModal();
      fetchGallery();
    } catch (err) {
      console.error('Batch upload error:', err);
      toast.error(err.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Submit Edit Date
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formDate) {
      toast.error('Date is required');
      return;
    }

    setUploading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/gallery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingItem.id,
          date: formDate
        })
      });

      if (!res.ok) throw new Error('Failed to update photo date');
      toast.success('Photo date updated successfully!');
      closeModal();
      fetchGallery();
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update date');
    } finally {
      setUploading(false);
    }
  };

  // Delete from Cloudinary and Supabase
  const handleDeletePhoto = async (item) => {
    const confirmed = await confirm(`Are you sure you want to delete this photo (${formatDate(item.date)})?`, {
      title: 'Delete Photo',
      type: 'danger',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id, image_url: item.image_url })
      });
      if (!res.ok) throw new Error('Failed to delete photo');

      toast.success('Photo removed from Cloudinary & Gallery!');
      fetchGallery();
    } catch (err) {
      console.error('Error deleting photo:', err);
      toast.error('Failed to delete photo');
    }
  };

  // Group photos by date
  const groupedGallery = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = gallery.filter(item => {
      return !q || (item.date && item.date.includes(q));
    });

    const groups = {};
    filtered.forEach(photo => {
      const d = photo.date ? photo.date.split('T')[0] : '2026-01-01';
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(photo);
    });

    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [gallery, searchQuery]);

  return (
    <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-5">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            NSS Photo Gallery Manager
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Date-Wise Batch Upload • Auto-Cloudinary CDN • {gallery.length} Photos in Gallery
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Upload Photos (Select Date & Files)
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by date (e.g. 2026-09)..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Date-Grouped Gallery Display */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold">Loading gallery photos...</p>
        </div>
      ) : groupedGallery.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-14 h-14 bg-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="font-bold text-slate-800 text-sm">No Photos in Gallery</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No photos match your date search.' : 'Click "Upload Photos" above to add pictures to your gallery.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedGallery.map(([dateStr, photos]) => (
            <div key={dateStr} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40">
              {/* Date Section Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {formatDate(dateStr)}
                  </h4>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {photos.map(item => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Image Preview */}
                    <div className="relative bg-slate-950 overflow-hidden flex items-center justify-center min-h-[130px] max-h-48">
                      <img
                        src={getDirectImageUrl(item.image_url)}
                        alt={item.date}
                        loading="lazy"
                        className="w-full h-auto max-h-48 object-contain group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition cursor-pointer"
                          title="View Photo"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-2 flex items-center justify-between text-xs bg-white">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.date?.split('T')[0]}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                          title="Change Date"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(item)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          title="Delete Photo"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Upload Batch Photos (Date & Files only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden z-10 animate-fade-in-up">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upload Photos</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select Date and Photos to upload</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBatchUpload} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Photo Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Photo Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                />
              </div>

              {/* Multi-file selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">
                  Select Photos *
                </label>
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/70 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesSelect}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse or Drag photos here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} photo(s) selected` : 'Select 1 or multiple photos'}
                  </p>
                </div>

                {/* Previews Grid */}
                {filePreviews.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-600">Selected Photos ({filePreviews.length})</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedFiles([]); setFilePreviews([]); }}
                        className="text-red-500 hover:text-red-700 text-[11px] font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                      {filePreviews.map((previewUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group bg-slate-900">
                          <img src={previewUrl} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFileAt(idx); }}
                            className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition cursor-pointer"
                            title="Remove"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-800 mb-1.5">
                    <span>Uploading {selectedFiles.length} photo(s)...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={uploading}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Photo Date only */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden z-10 animate-fade-in-up">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Change Photo Date</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 mb-1 flex items-center justify-center">
                <img src={getDirectImageUrl(editingItem.image_url)} alt="Preview" className="w-full h-auto max-h-48 object-contain" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Photo Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fullscreen Photo Preview */}
      {viewingItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setViewingItem(null)}>
          <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingItem(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getDirectImageUrl(viewingItem.image_url)}
              alt={viewingItem.date}
              className="max-h-[75vh] w-auto rounded-2xl shadow-2xl object-contain"
            />
            <div className="mt-3 text-center text-white">
              <p className="text-xs text-white/70 font-semibold">{formatDate(viewingItem.date)}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GalleryManager;
