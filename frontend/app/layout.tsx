import Providers from "../components/Providers";
import "./globals.css";

export const metadata = {
  title: "Nagarik Credits — Secure AI Credit Score Engine",
  description: "Next-generation financial scoring and micro-merchant credit trust engine in Nepal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-[#050811] text-[#f1f5f9] min-h-screen antialiased selection:bg-blue-600 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
          {children}
        </body>
      </html>
    </Providers>
  );
}
