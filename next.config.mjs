import os from 'os';
import withPWAInit from "@ducanh2912/next-pwa";


const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: false, // Ensure it works during local cloudflare testing
  workboxOptions: {
    disableDevLogs: true,
  },
});

const interfaces = os.networkInterfaces();
const localIps = Object.values(interfaces)
  .flat()
  .filter((iface) => iface.family === 'IPv4' && !iface.internal)
  .map((iface) => iface.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  turbopack: {},
  /* config options here */
  allowedDevOrigins: [...localIps, '127.0.0.1', 'localhost', '*.trycloudflare.com'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
