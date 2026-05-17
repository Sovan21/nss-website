export const metadata = {
  title: 'Admin Login - NSS Unit',
  description: 'Secure login portal for NSS Unit Administrators.',
  icons: {
    icon: [
      { url: '/admin-icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: ['/admin-icon.svg'],
    apple: ['/admin-icon.svg'],
  },
};

export default function AdminLoginLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
}
