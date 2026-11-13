import './globals.css';
import Nav from '@/components/Nav';

export const metadata = { title: 'Farmer-to-Market Crop Trading', description: 'Track crop supply, market prices and buyer payments in one place.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Nav />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
