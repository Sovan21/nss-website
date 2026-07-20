"use client";

import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { compressImage, deleteSupabaseImage } from '@/lib/utils';

const SettingsManager = ({ isDirty, setIsDirty }) => {
  const { toast } = useToast();
  const [siteData, setSiteData] = useState({ 
    hero_title: '', 
    hero_subtitle: '', 
    about_heading: '', 
    about_text: '', 
    about_image_url: '', 
    hero_slider_urls: [], 
    contact_email: '', 
    contact_phone: '', 
    contact_phone_2: '', 
    contact_whatsapp: '', 
    social_facebook: '', 
    social_instagram: '', 
    social_youtube: '' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [aboutSlots, setAboutSlots] = useState([]);
  const [sliderSlots, setSliderSlots] = useState([]);

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
    Whatsapp: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>,
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
          let phone1 = data.contact_phone || '';
          let phone2 = '';
          if (phone1.includes(',')) {
            const parts = phone1.split(',');
            phone1 = parts[0].trim();
            phone2 = parts[1]?.trim() || '';
          }
          setSiteData({ ...data, contact_phone: phone1, contact_phone_2: phone2 });
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
          const compressedFile = await compressImage(slot.file, 6, 1920);
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
          const compressedSlotFile = await compressImage(slot.file, 6, 1920);
          const fileName = `slider-${Date.now()}-${Math.floor(Math.random()*1000)}.${compressedSlotFile.name.split('.').pop()}`;
          await supabase.storage.from('nss-images').upload(fileName, compressedSlotFile);
          finalSliderUrls.push(supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl);
        } else { finalSliderUrls.push(slot.preview); }
      }

      const finalPhone = siteData.contact_phone_2 ? `${siteData.contact_phone},${siteData.contact_phone_2}` : siteData.contact_phone;
      const finalData = { ...siteData, contact_phone: finalPhone, about_image_url: updatedAboutImageUrl, hero_slider_urls: finalSliderUrls };
      delete finalData.contact_phone_2;
      
      if (siteData.id) await supabase.from('site_content').update(finalData).eq('id', siteData.id);
      else await supabase.from('site_content').insert([finalData]);

      toast.success("Settings Updated!"); setIsDirty(false); setSiteData({ ...finalData, contact_phone: siteData.contact_phone, contact_phone_2: siteData.contact_phone_2 });
      setSliderSlots(finalSliderUrls.map(url => ({ isNew: false, file: null, preview: url })));
      setAboutSlots(finalAboutUrls.map(url => ({ isNew: false, file: null, preview: url })));
    } catch (err) { toast.error("Failed to update settings."); } finally { setSaving(false); }
  };

  const ImageSlot = ({ slot, onRemove, onChange, emptyText = "Add Image" }) => (
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
              <textarea name="hero_title" value={siteData.hero_title || ''} onChange={handleChange} rows="2" className="w-full p-2.5 border border-purple-200 rounded-lg outline-none bg-white text-sm" placeholder="Hero Title (supports line breaks)"></textarea>
              <input name="hero_subtitle" value={siteData.hero_subtitle || ''} onChange={handleChange} className="w-full p-2.5 border border-purple-200 rounded-lg outline-none bg-white text-sm" placeholder="Hero Subtitle" />
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
              <input name="about_heading" value={siteData.about_heading || ''} onChange={handleChange} className="w-full p-2.5 border border-blue-200 rounded-lg outline-none bg-white text-sm" placeholder="About Heading" />
              <textarea name="about_text" value={siteData.about_text || ''} onChange={handleChange} rows="4" className="w-full p-2.5 border border-blue-200 rounded-lg outline-none bg-white text-sm" placeholder="About Text"></textarea>
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
                { name: 'contact_email', label: 'Contact Email', placeholder: 'nss@example.com', icon: <Icons.Email /> },
                { name: 'contact_phone', label: 'Primary Phone (Call Us 1)', placeholder: '+91 9876543210', icon: <Icons.Phone /> },
                { name: 'contact_phone_2', label: 'Secondary Phone (Call Us 2)', placeholder: '+91 9876543210', icon: <Icons.Phone /> },
                { name: 'contact_whatsapp', label: 'WhatsApp Channel Link', placeholder: 'https://whatsapp.com/channel/...', icon: <Icons.Whatsapp /> },
                { name: 'social_facebook', label: 'Facebook Link', placeholder: 'https://facebook.com/...', icon: <Icons.Facebook /> },
                { name: 'social_instagram', label: 'Instagram Link', placeholder: 'https://instagram.com/...', icon: <Icons.Instagram /> },
                { name: 'social_youtube', label: 'YouTube Link', placeholder: 'https://youtube.com/...', icon: <Icons.Youtube /> },
              ].map(field => (
                <div key={field.name} className="relative flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-indigo-800 ml-1">{field.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{field.icon}</div>
                    <input
                      name={field.name}
                      value={siteData[field.name] || ''}
                      onChange={handleChange}
                      className="w-full p-2.5 pl-10 border border-indigo-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                      placeholder={field.placeholder}
                    />
                  </div>
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
              {isDirty ? "You have unsaved changes. Click the button below to make them live." : "No changes to publish. Edit a field to enable publishing."}
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

export default SettingsManager;
