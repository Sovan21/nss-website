/**
 * UserAvatar Component & Utility Functions
 * Purpose: Shared avatar display and helper utilities for the NSS website.
 */

export const compressImage = (file, maxSizeMB = 2, maxWidth = 800) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) { resolve(file); return; }
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        const maxSizeBytes = maxSizeMB * 1024 * 1024; let quality = 0.9;
        const attemptCompress = () => {
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size > maxSizeBytes && quality > 0.1) { quality -= 0.1; attemptCompress(); } 
            else {
              const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              resolve(new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() }));
            }
          }, 'image/jpeg', quality);
        };
        attemptCompress();
      }; img.onerror = () => resolve(file);
    }; reader.onerror = () => resolve(file);
  });
};

export const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar = ({ user, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-slate-800 text-white font-bold border-2 border-transparent hover:border-blue-400 shadow-md overflow-hidden transition duration-200 focus:outline-none cursor-pointer"
      title={user?.full_name}
    >
      {user?.photo_url ? (
        <img
          src={user.photo_url}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-sm tracking-widest">
          {getInitials(user?.full_name)}
        </span>
      )}
    </button>
  );
};

export default UserAvatar;
