import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RIVIX - Restaurant Operations Platform',
    short_name: 'RIVIX',
    description: 'منصة أحدث وأسرع لتشغيل المطاعم وطلب المأكولات والمشويات',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B192C',
    theme_color: '#0B192C',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
