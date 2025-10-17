import './globals.css'
import { inter } from './fonts'
import Header from '@/components/Header'

export const metadata = {
  title: 'SpinHunters — App',
  description: 'Ecosistema interno de SpinHunters.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} dark bg-bg text-foreground antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  )
}
