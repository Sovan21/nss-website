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
  turbopack: {},
  /* config options here */
  allowedDevOrigins: [...localIps, '127.0.0.1', 'localhost', '*.trycloudflare.com'],
};

export default withPWA(nextConfig);
