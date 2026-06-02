import type { NextConfig } from "next";
import os from "os";

// Helper to resolve all local network IPv4 addresses of the host machine
const getLocalIPs = (): string[] => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const netInterface = interfaces[name];
    if (netInterface) {
      for (const iface of netInterface) {
        // We only care about active IPv4 external adapters
        if ((iface.family === "IPv4" || (iface.family as any) === 4) && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
  }
  return ips;
};

const localIPs = getLocalIPs();
const allowedOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  ...localIPs.map(ip => `${ip}:3000`),
  ...localIPs.map(ip => `http://${ip}:3000`),
  ...localIPs
];

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedOrigins,
};

export default nextConfig;
