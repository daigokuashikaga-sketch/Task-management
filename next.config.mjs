/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 はネイティブモジュールのため、サーバーコンポーネントの
  // バンドル対象から外して実行時に require させる。
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
