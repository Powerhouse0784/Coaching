// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '../components/Common/ErrorBoundary'
import { Providers } from './providers/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://intense-learners.vercel.app'),
  title: 'Intense Learners - Learn With Intensity',
  description: 'Learn from the best instructors with our comprehensive AI-powered courses',
  applicationName: 'Intense Learners',

  icons: {
    icon: '/coaching-icon.png',
    apple: '/coaching-icon.png',
    shortcut: '/coaching-icon.png',
  },

  openGraph: {
    title: 'Intense Learners',
    description:
      'Learn from the best instructors with our comprehensive AI-powered courses',
    siteName: 'Intense Learners',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Intense Learners",
              "url": "https://intense-learners.vercel.app"
            }),
          }}
        />
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}