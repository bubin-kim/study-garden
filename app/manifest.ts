import type { MetadataRoute } from 'next'

/**
 * PWA 설치 manifest (docs/02). 설치 요건은 이 파일 + HTTPS가 전부다 (서비스 워커 불요).
 * 색은 manifest 규격상 CSS 변수를 못 쓰므로 라이트 --bg 값을 그대로 적는다
 * (layout.tsx viewport.themeColor와 같은 예외).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Study Garden',
    short_name: 'Study Garden',
    description: '공부한 시간이 하나의 정원이 됩니다.',
    lang: 'ko',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#faf7f2',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
