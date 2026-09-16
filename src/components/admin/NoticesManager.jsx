"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate, getAdminAuthToken } from '@/lib/utils';
import useScrollLock from '@/lib/useScrollLock';

const NOTICE_CATEGORIES = [
  { id: 'all', label: 'All Notices' },
  { id: 'enrolment', label: 'Volunteer Enrolment' },
  { id: 'camps', label: 'Special Camps' },
  { id: 'events', label: 'Activities & Drives' },
  { id: 'guidelines', label: 'Guidelines & Rules' },
  { id: 'general', label: 'General Circular' }
];

const NoticesManager = ({ setIsDirty }) => {
  const { toast, confirm } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal / Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [viewingNotice, setViewingNotice] = useState(null);

  useScrollLock(showAddForm || editingNotice !== null || viewingNotice !== null);

  const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const generateRefNo = () => {
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(Math.random() * 900) + 100);
    return `BBC/NSS/${year}/NOT-${randomNum}`;
  };

  const defaultFormData = {
    title: '',
    ref_no: generateRefNo(),
    category: 'enrolment',
    date: getTodayDate(),
    is_urgent: false,
    is_new: true,
    issued_by: 'Programme Officer, NSS Unit I & II',
    summary: '',
    body: '',
    signatory: 'Programme Officer\nNSS Unit I & II\nBanwarilal Bhalotia College, Asansol'
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    setIsDirty(showAddForm || editingNotice !== null);
  }, [showAddForm, editingNotice, setIsDirty]);

  const getAuthToken = async () => {
    return await getAdminAuthToken();
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      // Try nss_notices first, then notices
      let { data, error } = await supabase.from('nss_notices').select('*').order('date', { ascending: false });
      if (error) {
        const fallback = await supabase.from('notices').select('*').order('date', { ascending: false });
        if (!fallback.error) {
          data = fallback.data;
        }
      }
      setNotices(data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openCreateModal = () => {
    setFormData({
      ...defaultFormData,
      ref_no: generateRefNo(),
      date: getTodayDate()
    });
    setEditingNotice(null);
    setShowAddForm(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      ref_no: notice.ref_no || notice.refNo || '',
      category: notice.category || 'enrolment',
      date: notice.date ? notice.date.split('T')[0] : getTodayDate(),
      is_urgent: Boolean(notice.is_urgent ?? notice.isUrgent),
      is_new: Boolean(notice.is_new ?? notice.isNew),
      issued_by: notice.issued_by || notice.issuedBy || '',
      summary: notice.summary || '',
      body: notice.body || '',
      signatory: notice.signatory || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Notice title is required');
      return;
    }

    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const payload = {
        title: formData.title.trim(),
        ref_no: formData.ref_no.trim(),
        category: formData.category,
        date: formData.date,
        is_urgent: formData.is_urgent,
        is_new: formData.is_new,
        issued_by: formData.issued_by.trim(),
        summary: formData.summary.trim(),
        body: formData.body.trim(),
        signatory: formData.signatory.trim()
      };

      if (editingNotice) {
        const res = await fetch('/api/admin/notices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingNotice.id, ...payload })
        });
        if (!res.ok) throw new Error('Failed to update notice');
        toast.success('Notice updated successfully!');
      } else {
        const res = await fetch('/api/admin/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create notice');
        toast.success('Notice published successfully!');
      }

      setShowAddForm(false);
      setEditingNotice(null);
      fetchNotices();
    } catch (err) {
      console.error('Error saving notice:', err);
      toast.error(err.message || 'Failed to save notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (notice) => {
    const confirmed = await confirm(`Are you sure you want to delete notice "${notice.title}"?`, {
      title: 'Delete Notice',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/notices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: notice.id, attachment_url: notice.attachment_url })
      });
      if (!res.ok) throw new Error('Failed to delete notice');

      toast.success('Notice deleted successfully!');
      fetchNotices();
    } catch (err) {
      console.error('Error deleting notice:', err);
      toast.error('Failed to delete notice');
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter(item => {
      const itemRef = item.ref_no || item.refNo || '';
      const itemCat = item.category || '';
      const matchesCategory = selectedCategory === 'all' || itemCat === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (itemRef && itemRef.toLowerCase().includes(q)) ||
        (item.summary && item.summary.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [notices, selectedCategory, searchQuery]);

  return (
    <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-5">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            </span>
            Official Notices Manager
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Publish, edit, and manage public circulars and announcements for students and volunteers.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Issue New Notice
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="relative w-full md:w-80">
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ref no..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {NOTICE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-bold animate-pulse">Loading notices...</div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-slate-500 font-bold text-sm">No notices found</p>
          <p className="text-xs text-slate-400 mt-1">Click "Issue New Notice" to publish your first announcement.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const isUrgent = notice.is_urgent ?? notice.isUrgent;
            const isNew = notice.is_new ?? notice.isNew;
            const refNo = notice.ref_no || notice.refNo || 'N/A';

            return (
              <div
                key={notice.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {refNo}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      {notice.category || 'General'}
                    </span>
                    {isUrgent && (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 bg-red-100 text-red-700 rounded-full animate-pulse">
                        URGENT
                      </span>
                    )}
                    {isNew && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                        NEW
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto md:ml-0 font-medium">
                      {formatDate(notice.date)}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1 leading-snug">
                    {notice.title}
                  </h4>
                  {notice.summary && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {notice.summary}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2 italic">
                    Issued by: {notice.issued_by || notice.issuedBy || 'NSS Unit'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => setViewingNotice(notice)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="Preview Notice"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button
                    onClick={() => openEditModal(notice)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                    title="Edit Notice"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    onClick={() => handleDeleteNotice(notice)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Delete Notice"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Form */}
      {(showAddForm || editingNotice) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowAddForm(false); setEditingNotice(null); }} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden z-10 animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {editingNotice ? 'Edit Notice' : 'Issue New Official Notice'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingNotice(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Notice Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Enrolment Notice: Fresh Volunteer Registration 2025-2027"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1 ml-1">
                    <label className="text-xs font-bold text-slate-700">Reference Number</label>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, ref_no: generateRefNo() }))}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    name="ref_no"
                    value={formData.ref_no}
                    onChange={handleInputChange}
                    placeholder="BBC/NSS/2026/NOT-001"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                  >
                    <option value="enrolment">Volunteer Enrolment</option>
                    <option value="camps">Special Camps</option>
                    <option value="events">Activities & Drives</option>
                    <option value="guidelines">Guidelines & Rules</option>
                    <option value="general">General Circular</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Issue Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_urgent"
                    name="is_urgent"
                    checked={formData.is_urgent}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="is_urgent" className="text-xs font-bold text-red-600 cursor-pointer">
                    Urgent Notice (Red Alert)
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_new"
                    name="is_new"
                    checked={formData.is_new}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="is_new" className="text-xs font-bold text-emerald-600 cursor-pointer">
                    Mark as "NEW" badge
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Issued By</label>
                <input
                  type="text"
                  name="issued_by"
                  value={formData.issued_by}
                  onChange={handleInputChange}
                  placeholder="e.g. Programme Officer, NSS Unit I & II"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Short Summary (Preview)</label>
                <input
                  type="text"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="1-2 sentences summarizing the circular..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Notice Body / Full Text *</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  rows="6"
                  required
                  placeholder="Write the full circular notice instructions and details..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Signatory Footer</label>
                <textarea
                  name="signatory"
                  value={formData.signatory}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="e.g. Programme Officer&#10;NSS Unit I & II&#10;B.B. College, Asansol"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setEditingNotice(null); }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? 'Publishing...' : editingNotice ? 'Update Notice' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview Notice */}
      {viewingNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingNotice(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden z-10 animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded border">
                {viewingNotice.ref_no || viewingNotice.refNo}
              </span>
              <button onClick={() => setViewingNotice(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="text-center border-b pb-4">
                <h4 className="font-black text-slate-900 text-lg uppercase tracking-wide">
                  National Service Scheme (NSS)
                </h4>
                <p className="text-xs text-slate-500 font-semibold">Banwarilal Bhalotia College, Asansol</p>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 border-b pb-2">
                <span>Date: {formatDate(viewingNotice.date)}</span>
                <span>Category: <strong className="capitalize">{viewingNotice.category}</strong></span>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-lg leading-snug mb-3">
                  {viewingNotice.title}
                </h3>
                <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                  {viewingNotice.body}
                </div>
              </div>

              {viewingNotice.signatory && (
                <div className="pt-6 border-t border-slate-100 text-right">
                  <p className="text-xs font-bold text-slate-800 whitespace-pre-line">
                    {viewingNotice.signatory}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NoticesManager;
