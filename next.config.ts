import type {NextConfig} from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Set dummy environment variables during build if they're missing
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dummy_key_for_build',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_dummy_key_for_build',
  },
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

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig as any);
