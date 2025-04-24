import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  webpack: (config, {isServer}) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        stream: false,
        timers: false,
        events: false,
      };
    }
    return config;
  },
};

export default nextConfig;
