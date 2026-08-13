/** @type {import('next').NextConfig} */
const nextConfig = {
  // تعطيل التحقق من TypeScript أثناء البناء
  typescript: {
    ignoreBuildErrors: true,
  },
  // تعطيل ESLint أثناء البناء
  eslint: {
    ignoreDuringBuilds: true,
  },
  // منع محاولة الاتصال بقاعدة البيانات أثناء البناء
  serverExternalPackages: ['drizzle-orm', 'pg'],
  // جعل DATABASE_URL اختيارية أثناء البناء
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
  },
  // منع التصدير الثابت للصفحات التي تحتاج إلى قاعدة بيانات
  output: 'standalone',
};

export default nextConfig;