import '../globals.css';
import { ReactNode } from 'react';
import { AuthProvider } from '../components/AuthProvider';
import { CartProvider } from '../components/CartProvider';
import { NavBar } from '../components/Navbar';
import Footer from '../components/Footer';
import Image from 'next/image';
import { ScrollToTop } from '../components/ScrollToTop';
import NextTopLoader from 'nextjs-toploader';

export const metadata = {
  title: 'Punto Hogar',
  description: 'Tienda de artículos para el hogar, ferretería y soluciones para cada proyecto.',
  icons: {
    icon: '/logo-punto-hogar.png'
  }
};

export const dynamic = 'force-dynamic';
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-surface-alt text-ink">
        <NextTopLoader color="#FF821C" />
        <AuthProvider>
          <CartProvider>
            <header className="sticky top-0 z-50 border-b shadow-sm bg-white/95 border-line backdrop-blur">
              <NavBar />
            </header>
            <ScrollToTop />
            <main id="main-content" tabIndex={-1} className="outline-none w-full min-h-[36vh] max-w-7xl px-2 py-8 mx-auto">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
