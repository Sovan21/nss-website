const fs = require('fs');
const path = 'e:/NSS Project/nss-website/src/app/admin/page.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename Banner Artwork to Event Banner
content = content.replace(/Banner Artwork/g, 'Event Banner');

// 2. Reduce internal box padding from p-4 sm:p-5 to p-3 sm:p-4 and adjust radius
content = content.replace(/bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl/g, 'bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl');

// 3. Replace Hover Overlay with "Tap to change" button
const oldHoverLabel = `<label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
 <span className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">Replace Artwork</span>
 <input type="file" accept="image/*" onChange={(e) => setEditBannerFile(e.target.files[0])} className="hidden"/>
 </label>`;

const newTapButton = `<label className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 shadow-sm cursor-pointer hover:bg-white transition-colors flex items-center gap-1 z-10">
 <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
 Tap to change
 <input type="file" accept="image/*" onChange={(e) => setEditBannerFile(e.target.files[0])} className="hidden"/>
 </label>`;
 
content = content.replace(oldHoverLabel, newTapButton);

// 4. Add Remove buttons to Gallery Previews
const oldGalleryPrevs = `{editingEvent.gallery_urls?.map((url, i) => (
 <div key={\`old-\${i}\`} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm"><img src={url} alt="Gallery" className="w-full h-full object-cover" /></div>
 ))}
 {previews.gallery.map((url, i) => (
 <div key={\`new-\${i}\`} className="aspect-square rounded-2xl overflow-hidden border-4 border-blue-400/30 shadow-md ring-2 ring-blue-400"><img src={url} alt="New Gallery" className="w-full h-full object-cover" /></div>
 ))}`;

const newGalleryPrevs = `{editingEvent.gallery_urls?.map((url, i) => (
 <div key={\`old-\${i}\`} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group">
   <img src={url} alt="Gallery" className="w-full h-full object-cover" />
   <button type="button" onClick={() => {
     const newUrls = [...editingEvent.gallery_urls];
     newUrls.splice(i, 1);
     setEditingEvent({...editingEvent, gallery_urls: newUrls});
   }} className="absolute top-1.5 right-1.5 bg-red-500/90 backdrop-blur-sm text-white p-1 rounded-full shadow-sm hover:bg-red-600 transition-colors z-10">
     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
   </button>
 </div>
 ))}
 {previews.gallery.map((url, i) => (
 <div key={\`new-\${i}\`} className="aspect-square rounded-2xl overflow-hidden border-4 border-blue-400/30 shadow-md ring-2 ring-blue-400 relative group">
   <img src={url} alt="New Gallery" className="w-full h-full object-cover" />
   <button type="button" onClick={() => {
     const newFiles = [...galleryFiles];
     newFiles.splice(i, 1);
     setGalleryFiles(newFiles);
   }} className="absolute top-1.5 right-1.5 bg-red-500/90 backdrop-blur-sm text-white p-1 rounded-full shadow-sm hover:bg-red-600 transition-colors z-10">
     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
   </button>
 </div>
 ))}`;

content = content.replace(oldGalleryPrevs, newGalleryPrevs);

fs.writeFileSync(path, content, 'utf8');
console.log('Final UI refinements applied');
