export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/admin-login/', '/api/'],
    },
    sitemap: 'https://nss-bbcollege.netlify.app/sitemap.xml',
  };
}
