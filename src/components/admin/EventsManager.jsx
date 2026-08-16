"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { compressImage, formatDate, deleteSupabaseImage, uploadAdminImage } from '@/lib/utils';

// ============================================================================
// NAME TAG INPUT — Smart tag-based name entry with live count
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
        <img src={evt.banner_url} alt="Banner" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" onClick={() => onView && onView(evt)} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h4 className="font-semibold text-slate-800 text-lg mb-1 line-clamp-1">{evt.title}</h4>
        <p className="text-sm text-slate-400 font-semibold mb-4 flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formatDate(evt.start_date)} — {formatDate(evt.end_date)}
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
// SECTION 3: EVENTS MANAGER
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
  const parseTags = useCallback((str) => (str || '').split(',').map(s => s.trim()).filter(Boolean), []);

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

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };


  const handleAddInputChange = (e) => setAddFormData({ ...addFormData, [e.target.name]: e.target.value });
  
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!bannerFile) return toast.warning("Please upload a banner image.");
    setSaving(true);
    try {
      const compressedBanner = await compressImage(bannerFile, 6, 1920);
      const bannerName = `banner-${Date.now()}.${compressedBanner.name.split('.').pop()}`;
      const bannerUrl = await uploadAdminImage(compressedBanner, bannerName);
      if (!bannerUrl) throw new Error("Failed to upload banner");

      const newEvent = { ...addFormData, banner_url: bannerUrl };
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newEvent)
      });
      if (!res.ok) throw new Error("Failed to create event");

      toast.success("Event Created Successfully!");
      setAddFormData({ title: '', start_date: '', end_date: '' }); setBannerFile(null); setShowAddForm(false);
      fetchEvents();
    } catch (err) { toast.error("Failed to create event."); console.error(err); } finally { setSaving(false); }
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
        const compressedBanner = await compressImage(editBannerFile, 6, 1920);
        const bannerName = `banner-edit-${Date.now()}.${compressedBanner.name.split('.').pop()}`;
        updatedBannerUrl = await uploadAdminImage(compressedBanner, bannerName);
        if (!updatedBannerUrl) throw new Error("Failed to upload banner");
      }

      let updatedGalleryUrls = editingEvent.gallery_urls || [];
      if (galleryFiles.length > 0) {
        if (galleryFiles.length + updatedGalleryUrls.length > 5) return toast.warning("Max 5 gallery images allowed.");
        for (let i = 0; i < galleryFiles.length; i++) {
          const compressedFile = await compressImage(galleryFiles[i], 6, 1920);
          const fileName = `gallery-${Date.now()}-${i}.${compressedFile.name.split('.').pop()}`;
          const gUrl = await uploadAdminImage(compressedFile, fileName);
          if (gUrl) updatedGalleryUrls.push(gUrl);
          else throw new Error("Failed to upload gallery image");
        }
      }

      const finalUpdates = {
        id: editingEvent.id,
        ...editFormData,
        banner_url: updatedBannerUrl,
        gallery_urls: updatedGalleryUrls,
        teachers_present: teacherTags.join(', '),
        volunteers_present: volunteerTags.join(', '),
      };
      
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(finalUpdates)
      });
      if (!res.ok) throw new Error("Failed to update event");

      toast.success("Event Updated!");
      setEditingEvent(null); fetchEvents();
    } catch (err) { toast.error("Failed to update event."); console.error(err); } finally { setSaving(false); }
  };

  const handleDeleteEvent = async (id) => {
    const confirmed = await confirm("Delete this event and all its images permanently?", { title:"Delete Event", type:"danger", confirmText:"Delete", cancelText:"Cancel" });
    if (!confirmed) return;
    const evt = events.find(e => e.id === id);
    if (!evt) return;

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch('/api/admin/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, banner_url: evt.banner_url, gallery_urls: evt.gallery_urls })
      });
      if (!res.ok) throw new Error("Failed to delete event");
      
      toast.success("Event deleted successfully.");
      fetchEvents();
    } catch (err) {
      toast.error("Failed to delete event.");
      console.error(err);
    }
  };

  const handleClearGallery = async () => {
    const confirmed = await confirm("Delete all gallery images for this event?", { title:"Clear Gallery", type:"danger", confirmText:"Clear All", cancelText:"Cancel" });
    if (!confirmed) return;
    try {
      for (let url of editingEvent.gallery_urls || []) await deleteSupabaseImage(url);
      
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingEvent.id, gallery_urls: [] })
      });
      if (!res.ok) throw new Error("Failed to clear gallery");

      setEditingEvent({...editingEvent, gallery_urls: []});
      toast.success("Gallery cleared!");
    } catch (err) {
      toast.error("Failed to clear gallery.");
      console.error(err);
    }
  };

  const removeNewGalleryImage = (indexToRemove) => {
    setGalleryFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const removeOldGalleryImage = async (indexToRemove) => {
    const confirmed = await confirm("Remove this image from the gallery?", { title:"Remove Image", type:"danger", confirmText:"Remove", cancelText:"Cancel" });
    if (!confirmed) return;
    try {
      const urlToRemove = editingEvent.gallery_urls[indexToRemove];
      const updatedUrls = editingEvent.gallery_urls.filter((_, idx) => idx !== indexToRemove);
      
      await deleteSupabaseImage(urlToRemove);
      
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingEvent.id, gallery_urls: updatedUrls })
      });
      if (!res.ok) throw new Error("Failed to remove image");

      setEditingEvent({ ...editingEvent, gallery_urls: updatedUrls });
      toast.success("Image removed!");
    } catch (err) {
      toast.error("Failed to remove image.");
      console.error(err);
    }
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

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-semibold text-xs">Loading Events...</p>
        </div>
      ) : (
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
                  <div className="space-y-6">
                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                      <label className="block text-sm font-semibold text-slate-500 mb-3 px-1">Basic Details</label>
                      <div className="space-y-4">
                        <div>
                          <input name="title" value={editFormData.title || ''} onChange={handleEditInputChange} required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800" placeholder="Event Title" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="px-1.5 text-sm font-semibold text-blue-600">Start Date</label>
                            <div className="relative date-input-wrapper">
                              <input type="date" name="start_date" value={editFormData.start_date || ''} onChange={handleEditInputChange} required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="px-1.5 text-sm font-semibold text-red-600">End Date</label>
                            <div className="relative date-input-wrapper">
                              <input type="date" name="end_date" value={editFormData.end_date || ''} onChange={handleEditInputChange} required className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                      <label className="block text-sm font-semibold text-slate-500 mb-2 px-1">Report Description</label>
                      <textarea name="description" value={editFormData.description || ''} onChange={handleEditInputChange} rows="6" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 resize-none" placeholder="Detailed event report..." />
                    </div>
                  </div>

                  <div className="space-y-6">
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

                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <NameTagInput label="Teachers Present" tags={teacherTags} onChange={setTeacherTags} color="purple" />
                      <NameTagInput label="Volunteers Present" tags={volunteerTags} onChange={setVolunteerTags} color="blue" />
                    </div>
                  </div>
                </div>

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

                <div className="mt-10 flex gap-4">
                  <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all active:scale-[0.98] text-sm md:text-base">Discard</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] text-sm md:text-base flex items-center justify-center gap-2">
                    {saving ? 'Publishing Changes...' : 'Update Event'}
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

export default EventsManager;
