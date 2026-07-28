const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: '/flashtor',
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
