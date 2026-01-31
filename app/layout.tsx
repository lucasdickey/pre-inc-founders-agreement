import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pre-Incorporation Founders Agreement | Stripe Atlas",
  description:
    "Align with your co-founders before incorporation. Capture equity, roles, and key decisions in one place.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23635bff'/><path d='M16.5 10c-2.1 0-3.4.9-3.4 2.4 0 1.9 2.8 2.1 2.8 3.2 0 .4-.4.8-1 .8-.9 0-2-.4-2.9-.9l-.5 2.3c.8.4 2.1.7 3.2.7 2.2 0 3.6-.9 3.6-2.5 0-2-2.8-2.2-2.8-3.2 0-.4.3-.7.9-.7.7 0 1.7.3 2.4.7l.5-2.2c-.7-.3-1.7-.6-2.8-.6z' fill='white'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950">
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-[#635bff] font-bold text-xl tracking-tight">stripe</span>
              <span className="text-white font-semibold">Atlas</span>
              <span className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full font-medium border border-white/10">
                Pre-Inc
              </span>
            </a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
