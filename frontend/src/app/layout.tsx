import './globals.css'
import Providers from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="border-b px-6 py-4 font-medium">
            Sabhyatam
          </header>
          {children}
        </Providers>
      </body>
    </html>
  )
}
