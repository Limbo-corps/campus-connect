import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});
// Display font for the brand wordmark / hero headlines.
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["500", "600", "700"],
});

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
    <html
      lang="en"
      className={`${dmSans.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
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
