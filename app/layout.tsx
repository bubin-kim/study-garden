import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SeasonProvider } from '@/components/SeasonProvider'
import { AppHeader } from '@/components/AppHeader'
import { DurationSheet } from '@/components/timer/DurationSheet'

export const metadata: Metadata = {
  title: 'Study Garden',
  description: '공부한 시간이 하나의 정원이 됩니다.',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#191b17' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <SeasonProvider>
          <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <AppHeader />
            {children}
          </div>
          <DurationSheet />
        </SeasonProvider>
      </body>
    </html>
  )
}
