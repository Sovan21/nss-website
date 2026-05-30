export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/admin-login/', '/api/'],
    },
    sitemap: 'https://nssbbcollege.netlify.app/sitemap.xml',
  };
}
