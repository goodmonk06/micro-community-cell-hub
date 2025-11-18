import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Micro Community Cell Hub',
  description: 'Manage sub-communities with cells, memberships, and sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
