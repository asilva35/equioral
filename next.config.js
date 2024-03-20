/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'test-nextjs-image-upload-02.s3.amazonaws.com',
      'equioral.s3.amazonaws.com',
    ],
  },
};

module.exports = nextConfig;
