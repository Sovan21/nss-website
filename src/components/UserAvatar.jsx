/**
 * UserAvatar Component & Utility Functions
 * Purpose: Shared avatar display and helper utilities for the NSS website.
 */

import { compressImage, getInitials } from '@/lib/utils';

export { compressImage, getInitials };

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
