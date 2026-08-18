const path = require('path');
const { config } = require('dotenv');

config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@buddyads/db'],
};

module.exports = nextConfig;
