"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { compressImage, getInitials, deleteSupabaseImage } from '@/lib/utils';

export const decodeDesignation = (raw) => {
  const defaults = {
    category: 'Teacher',
    designation: '',
    department: '',
    semester: '',
    blood_group: '',
    phone: '',
    email: '',
    registration_id: null
  };

  if (!raw) return defaults;

  if (raw.includes('::')) {
    const firstColon = raw.indexOf('::');
    const cat = raw.substring(0, firstColon);
    const rest = raw.substring(firstColon + 2);

    if (rest.startsWith('{')) {
      try {
        const parsed = JSON.parse(rest);
        return {
          category: cat,
          designation: parsed.designation || '',
          department: parsed.department || '',
          semester: parsed.semester || '',
          blood_group: parsed.blood_group || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          registration_id: parsed.registration_id || null
        };
      } catch (e) {
        return { ...defaults, category: cat, designation: rest };
      }
    }

    return { ...defaults, category: cat, designation: rest };
  }

  return { ...defaults, category: 'Teacher', designation: '' };
};

export const encodeDesignation = (category, designation, extra = {}) => {
  const hasExtra = extra.department || extra.semester || extra.blood_group || extra.phone || extra.email || extra.registration_id;
  if (!hasExtra) {
    return `${category}::${designation}`;
  }
  const payload = {
    designation: designation || '',
    department: extra.department || '',
    semester: extra.semester || '',
    blood_group: extra.blood_group || '',
    phone: extra.phone || '',
    email: extra.email || '',
    registration_id: extra.registration_id || null
  };
  return `${category}::${JSON.stringify(payload)}`;
};

const VolunteerSearchAutocomplete = ({ registrations, selectedVolId, onSelectVolunteer }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (selectedVolId) {
      const vol = registrations.find(r => String(r.id) === String(selectedVolId));
      if (vol) setQuery(vol.full_name);
    } else {
      setQuery('');
    }
  }, [selectedVolId, registrations]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedVolunteers = React.useMemo(() => {
    return [...registrations].sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || '', undefined, { sensitivity: 'base' })
    );
  }, [registrations]);

  const filteredVolunteers = React.useMemo(() => {
    if (!query.trim()) return sortedVolunteers;
    const q = query.toLowerCase().trim();
    return sortedVolunteers.filter(vol =>
      (vol.full_name || '').toLowerCase().includes(q) ||
      (vol.department || '').toLowerCase().includes(q) ||
      (vol.semester || '').toLowerCase().includes(q) ||
      (vol.email || '').toLowerCase().includes(q)
    );
  }, [sortedVolunteers, query]);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-bold text-gray-700 mb-1">
        Registered Volunteer Search (A-Z Suggestions) *
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onSelectVolunteer('');
            }
          }}
          placeholder="Type volunteer name to search (A-Z)..."
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-xs"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onSelectVolunteer('');
              setIsOpen(true);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-fade-in-up">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span>Suggestions (A to Z Ascending)</span>
            <span>{filteredVolunteers.length} Volunteers</span>
          </div>

          {filteredVolunteers.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 italic">
              No registered volunteer found matching "{query}"
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredVolunteers.map((vol) => {
                const isSelected = String(vol.id) === String(selectedVolId);
                return (
                  <div
                    key={vol.id}
                    onClick={() => {
                      onSelectVolunteer(vol.id);
                      setQuery(vol.full_name);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                      {vol.photo_url ? (
                        <img src={vol.photo_url} alt={vol.full_name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(vol.full_name)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {vol.full_name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {vol.department} {vol.semester ? `• ${vol.semester}` : ''} {vol.blood_group ? `• ${vol.blood_group}` : ''}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CommitteeManager = ({ setIsDirty }) => {
  const { toast, confirm } = useToast();
  const [members, setMembers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mainTab, setMainTab] = useState('teachers');
  const [volSubCategory, setVolSubCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);

  const initialFormState = {
    name: '',
    category: 'Teacher',
    designation: '',
    about: '',
    photo_url: null
  };

  const [newMember, setNewMember] = useState(initialFormState);
  const [selectedVolId, setSelectedVolId] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editingMember, setEditingMember] = useState(null);
  const [editFormData, setEditFormData] = useState(initialFormState);
  const [editImageFile, setEditImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => { setIsDirty(showAddForm || editingMember !== null); }, [showAddForm, editingMember, setIsDirty]);
  useEffect(() => { 
    fetchMembers();
    fetchRegistrations();
  }, []);

  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setShowAddForm(false);
    setNewMember({
      ...initialFormState,
      category: tab === 'teachers' ? 'Teacher' : 'Student'
    });
    setSelectedVolId('');
    setBannerFile(null);
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from('committee').select('*').order('id', { ascending: true });
      if (error) throw error;
      setMembers(data || []);
      return data || [];
    } catch (err) { console.error("Error fetching members:", err); return []; } finally { setLoading(false); }
  };

  const fetchRegistrations = async () => {
    try {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('role', 'volunteer')
        .order('full_name', { ascending: true });
      setRegistrations(data || []);
      return data || [];
    } catch (err) { console.error("Error fetching registrations:", err); return []; }
  };

  useEffect(() => {
    const initData = async () => {
      const commMembers = await fetchMembers();
      const regList = await fetchRegistrations();
      if (commMembers.length > 0 && regList.length > 0) {
        let updatedAny = false;
        for (const member of commMembers) {
          const decoded = decodeDesignation(member.designation);
          if (decoded.category === 'Teacher') continue;
          if (!decoded.department || !decoded.registration_id || !decoded.blood_group) {
            const matchingVol = regList.find(r => r.full_name && member.name && r.full_name.toLowerCase().trim() === member.name.toLowerCase().trim());
            if (matchingVol) {
              const encoded = encodeDesignation(decoded.category, decoded.designation, {
                registration_id: matchingVol.id,
                department: matchingVol.department || '',
                semester: matchingVol.semester || '',
                blood_group: matchingVol.blood_group || '',
                phone: matchingVol.phone || '',
                email: matchingVol.email || ''
              });
              await supabase.from('committee').update({
                designation: encoded,
                about: member.about || matchingVol.bio || '',
                image_url: member.image_url || matchingVol.photo_url || null
              }).eq('id', member.id);
              updatedAny = true;
            }
          }
        }
        if (updatedAny) {
          fetchMembers();
        }
      }
    };
    initData();
  }, []);

  const handleSelectVolunteer = (e) => {
    const volId = e.target.value;
    setSelectedVolId(volId);
  };

  const handleAddInputChange = (e) => setNewMember({ ...newMember, [e.target.name]: e.target.value });

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mainTab === 'teachers') {
        let imageUrl = null;
        if (bannerFile) {
          const compressedFile = await compressImage(bannerFile, 5, 1200);
          const fileExt = compressedFile.name.split('.').pop();
          const fileName = `committee-${Date.now()}.${fileExt}`;
          await supabase.storage.from('nss-images').upload(fileName, compressedFile);
          imageUrl = supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl;
        }

        const encodedDesignation = encodeDesignation('Teacher', newMember.designation);

        const memberData = {
          name: newMember.name,
          designation: encodedDesignation,
          about: newMember.about,
          image_url: imageUrl
        };
        const { error } = await supabase.from('committee').insert([memberData]);
        if (error) throw error;

        toast.success("New Teacher / Mentor Added!");
      } else {
        const selectedVol = registrations.find(r => String(r.id) === String(selectedVolId));
        if (!selectedVol) {
          toast.error("Please select a registered volunteer.");
          setSaving(false);
          return;
        }

        const category = newMember.category || 'Student';
        const encodedDesignation = encodeDesignation(category, newMember.designation, {
          registration_id: selectedVol.id
        });

        const memberData = {
          name: selectedVol.full_name,
          designation: encodedDesignation,
          about: selectedVol.bio || '',
          image_url: selectedVol.photo_url || null
        };
        const { error } = await supabase.from('committee').insert([memberData]);
        if (error) throw error;

        toast.success("Committee Member Added!");
      }

      setNewMember({
        ...initialFormState,
        category: mainTab === 'teachers' ? 'Teacher' : 'Student'
      });
      setSelectedVolId('');
      setBannerFile(null);
      setShowAddForm(false);
      fetchMembers();
    } catch (err) { toast.error("Failed to add member."); } finally { setSaving(false); }
  };

  const openEditModal = (member) => {
    const decoded = decodeDesignation(member.designation);
    setEditFormData({
      name: member.name,
      category: decoded.category || (mainTab === 'teachers' ? 'Teacher' : 'Student'),
      designation: decoded.designation || '',
      about: member.about || '',
      photo_url: member.image_url || null
    });
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
        const compressedFile = await compressImage(editImageFile, 5, 1200);
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `committee-edit-${Date.now()}.${fileExt}`;
        await supabase.storage.from('nss-images').upload(fileName, compressedFile);
        updatedImageUrl = supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl;
      }

      const decoded = decodeDesignation(editingMember.designation);
      const vol = decoded.registration_id ? registrations.find(r => String(r.id) === String(decoded.registration_id)) : null;

      let encodedDesignation;
      if (editFormData.category === 'Teacher') {
        encodedDesignation = encodeDesignation('Teacher', editFormData.designation);
      } else {
        encodedDesignation = encodeDesignation(editFormData.category, editFormData.designation, {
          registration_id: decoded.registration_id || null,
          department: vol?.department || decoded.department || '',
          semester: vol?.semester || decoded.semester || '',
          blood_group: vol?.blood_group || decoded.blood_group || '',
          phone: vol?.phone || decoded.phone || '',
          email: vol?.email || decoded.email || ''
        });
      }

      const finalUpdates = {
        name: editFormData.name,
        designation: encodedDesignation,
        about: editFormData.about,
        image_url: updatedImageUrl
      };
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

  const filteredMembers = members.filter(m => {
    const decoded = decodeDesignation(m.designation);
    if (mainTab === 'teachers') {
      return decoded.category === 'Teacher';
    } else {
      if (decoded.category === 'Teacher') return false;
      if (volSubCategory === 'All') return true;
      return decoded.category === volSubCategory;
    }
  });

  const PlusIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
  const EditIcon = () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  const TrashIcon = () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

  return (
    <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
      
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => handleMainTabChange('teachers')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${mainTab === 'teachers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Teachers / Mentors
        </button>
        <button
          onClick={() => handleMainTabChange('volunteers')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${mainTab === 'volunteers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Volunteer Committee
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">
            {mainTab === 'teachers' ? 'Teachers & Mentors' : 'Volunteer Committee Members'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {mainTab === 'teachers' ? 'Manage teachers and program officers' : 'Manage student volunteers across committee categories'}
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition shadow-sm text-sm"
        >
          {showAddForm ? 'Cancel' : <><PlusIcon /> {mainTab === 'teachers' ? 'Add Teacher / Mentor' : 'Add Member'}</>}
        </button>
      </div>

      {mainTab === 'volunteers' && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'All', label: 'All Volunteers' },
            { id: 'Student', label: 'Student Committee' },
            { id: 'Cultural', label: 'Cultural Committee' },
            { id: 'Environment', label: 'Environment Committee' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setVolSubCategory(cat.id)}
              className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition ${volSubCategory === cat.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddMember} className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8 animate-fade-in-up">
          <h4 className="font-extrabold text-blue-900 text-base mb-4 border-b border-blue-100 pb-2">
            {mainTab === 'teachers' ? 'Add Teacher / Mentor' : 'Add Committee Member'}
          </h4>
          
          {mainTab === 'teachers' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input name="name" value={newMember.name} onChange={handleAddInputChange} required className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dr. John Doe"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Designation *</label>
                <input name="designation" value={newMember.designation} onChange={handleAddInputChange} required className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Program Officer, Mentor"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">About / Bio *</label>
                <textarea name="about" value={newMember.about} onChange={handleAddInputChange} required rows="3" className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Write a short bio..."></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Profile Picture (Optional)</label>
                <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-blue-200 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition text-sm font-semibold text-blue-600">
                  {bannerFile ? bannerFile.name : '+ Click to Add Photo'}
                  <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <VolunteerSearchAutocomplete
                    registrations={registrations}
                    selectedVolId={selectedVolId}
                    onSelectVolunteer={(volId) => setSelectedVolId(volId)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Committee Category *</label>
                  <select
                    name="category"
                    value={newMember.category}
                    onChange={handleAddInputChange}
                    required
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Student">Student Committee</option>
                    <option value="Cultural">Cultural Committee</option>
                    <option value="Environment">Environment Committee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Committee Designation / Role *</label>
                <input
                  name="designation"
                  value={newMember.designation}
                  onChange={handleAddInputChange}
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Student Coordinator, Cultural Lead, Eco Volunteer"
                />
              </div>

              {selectedVolId && (() => {
                const vol = registrations.find(r => String(r.id) === String(selectedVolId));
                if (!vol) return null;
                return (
                  <div className="bg-white p-3.5 rounded-xl border border-blue-200 flex items-center gap-4 shadow-xs">
                    {vol.photo_url ? (
                      <img src={vol.photo_url} alt={vol.full_name} className="w-12 h-12 rounded-full object-cover border" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                        {getInitials(vol.full_name)}
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm">{vol.full_name}</h5>
                      <p className="text-xs text-gray-500">{vol.department} • {vol.semester} {vol.blood_group ? `| Blood: ${vol.blood_group}` : ''}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <button type="submit" disabled={saving || (mainTab === 'volunteers' && !selectedVolId)} className="mt-6 w-full text-white font-bold py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition shadow-md text-sm disabled:opacity-50">
            {saving ? 'Saving...' : mainTab === 'teachers' ? 'Save Teacher Profile' : 'Add Member'}
          </button>
        </form>
      )}

      {loading ? <div className="text-center py-10 text-gray-500 font-bold">Loading committee members...</div> : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">
            {mainTab === 'teachers' ? 'No teachers or mentors found.' : 'No volunteer committee members found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => {
            const decoded = decodeDesignation(member.designation);
            const vol = decoded.registration_id ? registrations.find(r => String(r.id) === String(decoded.registration_id)) : null;

            const cardName = vol?.full_name || member.name;
            const cardDept = vol?.department || decoded.department;
            const cardSem = vol?.semester || decoded.semester;
            const cardPhoto = vol?.photo_url || member.image_url;

            if (mainTab === 'teachers') {
              return (
                <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="p-6 flex flex-col items-center text-center flex-1">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-md mb-4 bg-slate-100" />
                    ) : (
                      <div className="w-28 h-28 rounded-full border-4 border-white shadow-md mb-4 bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-400 font-black text-2xl">{getInitials(member.name)}</span>
                      </div>
                    )}
                    <h4 className="font-bold text-lg mb-1">{member.name}</h4>
                    <p className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-widest mb-1.5">Teacher / Mentor</p>
                    <p className="text-sm text-indigo-600 font-semibold">{decoded.designation || "Mentor"}</p>
                  </div>
                  <div className="flex border-t border-gray-100">
                    <button onClick={() => openEditModal(member)} className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-blue-50 flex justify-center items-center"><EditIcon /> Edit</button>
                    <div className="w-px bg-gray-100"></div>
                    <button onClick={() => handleDeleteMember(member.id)} className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-red-50 flex justify-center items-center"><TrashIcon /> Delete</button>
                  </div>
                </div>
              );
            } else {
              const badgeColors = {
                Cultural: 'bg-pink-100 text-pink-700 border-pink-200',
                Student: 'bg-blue-100 text-blue-700 border-blue-200',
                Environment: 'bg-emerald-100 text-emerald-700 border-emerald-200'
              };
              const categoryBadge = badgeColors[decoded.category] || badgeColors.Student;

              return (
                <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                  <div className="p-5 flex flex-col items-center text-center flex-1">
                    {cardPhoto ? (
                      <img src={cardPhoto} alt={cardName} className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-sm mb-3 bg-slate-100" />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-sm mb-3 bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-500 font-black text-xl">{getInitials(cardName)}</span>
                      </div>
                    )}
                    <h4 className="font-bold text-base text-gray-900 mb-1 leading-snug">{cardName}</h4>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-widest mb-2 ${categoryBadge}`}>
                      {decoded.category} Committee
                    </span>
                    <p className="text-xs text-blue-700 font-bold mb-2">{decoded.designation}</p>
                    {(cardDept || cardSem) && (
                      <p className="text-[11px] text-gray-500 font-semibold bg-gray-50 px-2 py-1 rounded w-full line-clamp-1">
                        {cardDept} {cardSem ? `• ${cardSem}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex border-t border-gray-100 bg-gray-50/50">
                    <button onClick={() => openEditModal(member)} className="flex-1 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex justify-center items-center transition">
                      <EditIcon /> Edit
                    </button>
                    <div className="w-px bg-gray-100"></div>
                    <button onClick={() => handleDeleteMember(member.id)} className="flex-1 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex justify-center items-center transition">
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0 border-b-4 border-blue-500">
              <h3 className="font-bold text-base flex items-center gap-2">
                Update {editFormData.category === 'Teacher' ? 'Teacher / Mentor' : 'Committee Designation'}
              </h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateMember} className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 space-y-4">
              {editFormData.category === 'Teacher' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Dr. John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Designation *</label>
                    <input
                      name="designation"
                      value={editFormData.designation}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Program Officer, Mentor"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">About / Bio *</label>
                    <textarea
                      name="about"
                      value={editFormData.about}
                      onChange={handleEditInputChange}
                      required
                      rows="3"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Write a short bio..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Profile Picture</label>
                    {editFormData.photo_url && !removeImage && (
                      <div className="mb-2 flex items-center gap-3 bg-white p-2.5 rounded-lg border border-gray-200">
                        <img src={editFormData.photo_url} alt="Current" className="w-12 h-12 rounded-full object-cover border" />
                        <button
                          type="button"
                          onClick={() => setRemoveImage(true)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 transition"
                        >
                          Remove Photo
                        </button>
                      </div>
                    )}
                    <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-blue-200 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition text-xs font-semibold text-blue-600">
                      {editImageFile ? editImageFile.name : '+ Upload New Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setEditImageFile(e.target.files[0]);
                          setRemoveImage(false);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Committee Category *</label>
                    <select
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Student">Student Committee</option>
                      <option value="Cultural">Cultural Committee</option>
                      <option value="Environment">Environment Committee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Designation / Role *</label>
                    <input
                      name="designation"
                      value={editFormData.designation}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 shrink-0 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md text-sm"
                >
                  {saving ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeManager;
