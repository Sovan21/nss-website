import AdminAuthLayout from './AdminAuthLayout';

export const metadata = {
  title: 'NSS Admin',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/admin-icon.svg',
  },
};

export default function AdminLayout({ children }) {
  return <AdminAuthLayout>{children}</AdminAuthLayout>;
}
