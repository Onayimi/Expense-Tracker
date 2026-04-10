/** @type {import('next').NextConfig} */
const nextConfig = {
  // Scope the TypeScript project to the web app source only.
  // This prevents Next.js from accidentally type-checking the mobile/ Expo folder.
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

module.exports = nextConfig;
