/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Excluir Playwright del bundle de producción en Vercel
  serverExternalPackages: ['playwright', 'playwright-core'],
};

module.exports = nextConfig;
