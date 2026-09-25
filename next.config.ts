const nextConfig: any = {
  // ESLint hatalarını build aşamasında görmezden gel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript hatalarını build aşamasında görmezden gel
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;