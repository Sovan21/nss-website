"use client";

import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { compressImage } from '@/lib/utils';

const AchievementsManager = ({ setIsDirty }) => {
  const { toast, confirm } = useToast();
  const [subTab, setSubTab] = useState("camps"); // "camps" | "alumni"

  // Camps states
  const [camps, setCamps] = useState([]);
  const [campsLoading, setCampsLoading] = useState(true);
  const [showCampForm, setShowCampForm] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [campFormData, setCampFormData] = useState({
    camp_type: "NIC",
    volunteers: "",
    location: "",
    po_name: "",
    year: ""
  });

  // Alumni states
  const [alumni, setAlumni] = useState([]);
  const [alumniLoading, setAlumniLoading] = useState(true);
  const [showAlumniForm, setShowAlumniForm] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState(null);
  const [alumniFormData, setAlumniFormData] = useState({
    name: "",
    passing_year: "",
    current_position: "",
    organization: "",
    description: ""
  });
  const [alumniPhotoFile, setAlumniPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsDirty(showCampForm || showAlumniForm || editingCamp !== null || editingAlumni !== null);
  }, [showCampForm, showAlumniForm, editingCamp, editingAlumni, setIsDirty]);

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase.from("nss_camps").select("*").order("year", { ascending: false });
      if (error) throw error;
      setCamps(data || []);
    } catch (err) {
      console.error("Error fetching camps:", err);
      toast.error("Failed to fetch camps achievements");
    } finally {
      setCampsLoading(false);
    }
  };

  const fetchAlumni = async () => {
    try {
      const { data, error } = await supabase.from("nss_alumni").select("*").order("passing_year", { ascending: false });
      if (error) throw error;
      setAlumni(data || []);
    } catch (err) {
      console.error("Error fetching alumni:", err);
      toast.error("Failed to fetch alumni achievements");
    } finally {
      setAlumniLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
    fetchAlumni();
  }, []);

  const handleCampInputChange = (e) => {
    setCampFormData({ ...campFormData, [e.target.name]: e.target.value });
  };

  const handleAlumniInputChange = (e) => {
    setAlumniFormData({ ...alumniFormData, [e.target.name]: e.target.value });
  };

  const handleCampSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCamp) {
        const { error } = await supabase.from("nss_camps").update(campFormData).eq("id", editingCamp.id);
        if (error) throw error;
        toast.success("Camp achievement updated successfully!");
      } else {
        const { error } = await supabase.from("nss_camps").insert([campFormData]);
        if (error) throw error;
        toast.success("Camp achievement added successfully!");
      }
      setCampFormData({ camp_type: "NIC", volunteers: "", location: "", po_name: "", year: "" });
      setEditingCamp(null);
      setShowCampForm(false);
      fetchCamps();
    } catch (err) {
      console.error("Error saving camp:", err);
      toast.error("Failed to save camp achievement");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCamp = (camp) => {
    setEditingCamp(camp);
    setCampFormData({
      camp_type: camp.camp_type,
      volunteers: camp.volunteers,
      location: camp.location,
      po_name: camp.po_name,
      year: camp.year
    });
    setShowCampForm(true);
  };

  const handleDeleteCamp = async (id) => {
    const confirmed = await confirm("Are you sure you want to delete this camp achievement? This action cannot be undone.", {
      title: "Delete Camp Achievement",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from("nss_camps").delete().eq("id", id);
      if (error) throw error;
      toast.success("Camp achievement deleted successfully");
      fetchCamps();
    } catch (err) {
      console.error("Error deleting camp:", err);
      toast.error("Failed to delete camp achievement");
    }
  };

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl = editingAlumni ? editingAlumni.photo_url : null;
      if (alumniPhotoFile) {
        const compressedFile = await compressImage(alumniPhotoFile, 5, 600);
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `alumni-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("nss-images").upload(fileName, compressedFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("nss-images").getPublicUrl(fileName);
        photoUrl = publicUrlData.publicUrl;
      }

      const postData = { ...alumniFormData, photo_url: photoUrl };

      if (editingAlumni) {
        const { error } = await supabase.from("nss_alumni").update(postData).eq("id", editingAlumni.id);
        if (error) throw error;
        toast.success("Alumni profile updated successfully!");
      } else {
        const { error } = await supabase.from("nss_alumni").insert([postData]);
        if (error) throw error;
        toast.success("Alumni profile added successfully!");
      }
      setAlumniFormData({ name: "", passing_year: "", current_position: "", organization: "", description: "" });
      setAlumniPhotoFile(null);
      setEditingAlumni(null);
      setShowAlumniForm(false);
      fetchAlumni();
    } catch (err) {
      console.error("Error saving alumni:", err);
      toast.error("Failed to save alumni profile");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAlumni = (alum) => {
    setEditingAlumni(alum);
    setAlumniFormData({
      name: alum.name,
      passing_year: alum.passing_year,
      current_position: alum.current_position,
      organization: alum.organization,
      description: alum.description
    });
    setShowAlumniForm(true);
  };

  const handleDeleteAlumni = async (alum) => {
    const confirmed = await confirm(`Are you sure you want to delete ${alum.name}'s profile? This action cannot be undone.`, {
      title: "Delete Alumni Profile",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!confirmed) return;
    try {
      if (alum.photo_url && alum.photo_url.includes("nss-images")) {
        const fileName = alum.photo_url.split("/").pop();
        await supabase.storage.from("nss-images").remove([fileName]);
      }
      const { error } = await supabase.from("nss_alumni").delete().eq("id", alum.id);
      if (error) throw error;
      toast.success("Alumni profile deleted successfully");
      fetchAlumni();
    } catch (err) {
      console.error("Error deleting alumni:", err);
      toast.error("Failed to delete alumni profile");
    }
  };

  const handleCancelCamp = () => {
    setCampFormData({ camp_type: "NIC", volunteers: "", location: "", po_name: "", year: "" });
    setEditingCamp(null);
    setShowCampForm(false);
  };

  const handleCancelAlumni = () => {
    setAlumniFormData({ name: "", passing_year: "", current_position: "", organization: "", description: "" });
    setAlumniPhotoFile(null);
    setEditingAlumni(null);
    setShowAlumniForm(false);
  };

  const PlusIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
  const EditIcon = () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  const TrashIcon = () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

  return (
    <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex gap-4 border-b border-gray-100 pb-4 mb-6">
        <button
          onClick={() => setSubTab("camps")}
          className={`pb-2 px-1 font-bold text-sm md:text-base border-b-2 transition-all cursor-pointer ${
            subTab === "camps"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Camps Achievements
        </button>
        <button
          onClick={() => setSubTab("alumni")}
          className={`pb-2 px-1 font-bold text-sm md:text-base border-b-2 transition-all cursor-pointer ${
            subTab === "alumni"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Alumni Success Stories
        </button>
      </div>

      {subTab === "camps" ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-gray-800">Special Camps Achievements</h4>
            <button
              onClick={() => setShowCampForm(!showCampForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-xs md:text-sm"
            >
              {showCampForm ? "Cancel" : <><PlusIcon /> Add Camp</>}
            </button>
          </div>

          {showCampForm && (
            <form onSubmit={handleCampSubmit} className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 mb-8">
              <h5 className="font-bold text-slate-800 mb-4">{editingCamp ? "Edit Camp Achievement" : "Add New Camp Achievement"}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Camp Type *</label>
                  <select
                    name="camp_type"
                    value={campFormData.camp_type}
                    onChange={handleCampInputChange}
                    required
                    className="w-full p-2 border rounded-lg bg-white text-sm"
                  >
                    <option value="NIC">NIC (National Integration Camp)</option>
                    <option value="Pre-RD">Pre-RD (Pre-Republic Day Camp)</option>
                    <option value="Adventure Camp">Adventure Camp</option>
                    <option value="Youth Festival">Youth Festival</option>
                    <option value="Other">Other Camp</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Year * (e.g. 2026)</label>
                  <input
                    name="year"
                    value={campFormData.year}
                    onChange={handleCampInputChange}
                    required
                    placeholder="e.g. 2026"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Location *</label>
                  <input
                    name="location"
                    value={campFormData.location}
                    onChange={handleCampInputChange}
                    required
                    placeholder="e.g. Kolkata, West Bengal"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Program Officer (PO) *</label>
                  <input
                    name="po_name"
                    value={campFormData.po_name}
                    onChange={handleCampInputChange}
                    required
                    placeholder="e.g. Dr. Amit Dey"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold mb-1 block">Volunteers Involved *</label>
                  <textarea
                    name="volunteers"
                    value={campFormData.volunteers}
                    onChange={handleCampInputChange}
                    required
                    placeholder="e.g. Rahul Dev, Anjali Sharma"
                    rows="2"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs md:text-sm"
                >
                  {saving ? "Saving..." : editingCamp ? "Update Camp" : "Add Camp"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelCamp}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-lg text-xs md:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {campsLoading ? (
            <div className="text-center py-6 text-slate-400">Loading camps achievements...</div>
          ) : camps.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed">No camp achievements recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white whitespace-nowrap text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold">
                    <th className="p-3">Camp Type</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">PO Name</th>
                    <th className="p-3">Volunteers</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {camps.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{camp.camp_type}</td>
                      <td className="p-3 text-slate-600">{camp.year}</td>
                      <td className="p-3 text-slate-600">{camp.location}</td>
                      <td className="p-3 text-slate-600">{camp.po_name}</td>
                      <td className="p-3 text-slate-600 truncate max-w-xs" title={camp.volunteers}>{camp.volunteers}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => handleEditCamp(camp)}
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg flex items-center font-semibold text-xs"
                        >
                          <EditIcon /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCamp(camp.id)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg flex items-center font-semibold text-xs"
                        >
                          <TrashIcon /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-gray-800">Alumni Success Stories</h4>
            <button
              onClick={() => setShowAlumniForm(!showAlumniForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-xs md:text-sm"
            >
              {showAlumniForm ? "Cancel" : <><PlusIcon /> Add Alumni</>}
            </button>
          </div>

          {showAlumniForm && (
            <form onSubmit={handleAlumniSubmit} className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 mb-8">
              <h5 className="font-bold text-slate-800 mb-4">{editingAlumni ? "Edit Alumni Profile" : "Add New Alumni Profile"}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Full Name *</label>
                  <input
                    name="name"
                    value={alumniFormData.name}
                    onChange={handleAlumniInputChange}
                    required
                    placeholder="e.g. Sanjay Dutta"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">NSS Batch * (Passing Year)</label>
                  <input
                    name="passing_year"
                    value={alumniFormData.passing_year}
                    onChange={handleAlumniInputChange}
                    required
                    placeholder="e.g. 2023"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Current Position *</label>
                  <input
                    name="current_position"
                    value={alumniFormData.current_position}
                    onChange={handleAlumniInputChange}
                    required
                    placeholder="e.g. Software Engineer"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Organization/Company *</label>
                  <input
                    name="organization"
                    value={alumniFormData.organization}
                    onChange={handleAlumniInputChange}
                    required
                    placeholder="e.g. TCS / Google"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold mb-1 block">Success Details * (What they are doing / their achievement)</label>
                  <textarea
                    name="description"
                    value={alumniFormData.description}
                    onChange={handleAlumniInputChange}
                    required
                    placeholder="e.g. Currently leading community volunteer programs in West Bengal and managing IT operations."
                    rows="3"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-blue-700">Profile Photo (Optional)</label>
                  <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-blue-200 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition text-sm font-semibold text-blue-600">
                    {alumniPhotoFile ? alumniPhotoFile.name : "+ Click to Upload Photo"}
                    <input type="file" accept="image/*" onChange={(e) => setAlumniPhotoFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs md:text-sm"
                >
                  {saving ? "Saving..." : editingAlumni ? "Update Profile" : "Add Alumni"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAlumni}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-lg text-xs md:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {alumniLoading ? (
            <div className="text-center py-6 text-slate-400">Loading alumni profiles...</div>
          ) : alumni.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed">No alumni records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white whitespace-nowrap text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold">
                    <th className="p-3">Photo</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">NSS Batch</th>
                    <th className="p-3">Position</th>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumni.map((alum) => (
                    <tr key={alum.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        {alum.photo_url ? (
                          <img src={alum.photo_url} alt={alum.name} className="w-10 h-10 rounded-full object-cover border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center text-slate-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{alum.name}</td>
                      <td className="p-3 text-slate-600">{alum.passing_year}</td>
                      <td className="p-3 text-slate-600">{alum.current_position}</td>
                      <td className="p-3 text-slate-600">{alum.organization}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => handleEditAlumni(alum)}
                          className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg flex items-center font-semibold text-xs"
                        >
                          <EditIcon /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAlumni(alum)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg flex items-center font-semibold text-xs"
                        >
                          <TrashIcon /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AchievementsManager;
