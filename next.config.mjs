/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "http://localhost.local:3000",
    "http://localhost.local",
    "http://app.localhost.local:3000",
    "http://app.localhost.local",
    "http://tenant1.localhost.local:3000",
    "http://tenant1.localhost.local",
    "https://localhost.local:3000",
    "https://localhost.local",
    "https://app.localhost.local:3000",
    "https://app.localhost.local",
    "https://tenant1.localhost.local:3000",
    "https://tenant1.localhost.local",
  ],
};

export default nextConfig;
