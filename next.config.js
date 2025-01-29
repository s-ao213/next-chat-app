/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["otfwmdyekyeqsiurficc.supabase.co"],
  },
  experimental: {
    serverActions: true,
  },
  // Prisma関連の設定を追加
  webpack: (config) => {
    config.externals = [...config.externals, "pg-native"];
    return config;
  },
  images: {
    domains: ["otfwmdyekyeqsiurficc.supabase.co"], // Supabaseのプロジェクトドメインを追加
  },
};

module.exports = nextConfig;
