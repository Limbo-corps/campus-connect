import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "Campus Connect",
  description: "Connect with your campus community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved accent hue before paint to avoid a flash of default theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var h=localStorage.getItem('app-hue');if(h)document.documentElement.style.setProperty('--app-hue',h);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[--background] font-sans antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
