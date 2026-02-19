import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Sluglime Community',
  description: 'College community platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/dashboard" className="text-lg font-bold text-brand-600">Sluglime</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/public">Public Feed</Link>
              <Link href="/create-post">Create Post</Link>
              <form action="/api/auth/logout" method="post"><button type="submit">Logout</button></form>
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
