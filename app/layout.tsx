import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pre-Incorporation Founders Agreement | Stripe Atlas",
  description:
    "Align with your co-founders before incorporation. Capture equity, roles, and key decisions in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stripe-gray-50">
        <nav className="border-b border-stripe-border bg-white sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <svg
                viewBox="0 0 60 25"
                className="h-5 w-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.977 3.074c0-1.027.855-1.455 2.273-1.455 2.031 0 4.586.617 6.617 1.714V.493C20.546.162 18.27 0 15.994 0 10.663 0 7.094 2.671 7.094 7.13c0 6.958 9.577 5.846 9.577 8.848 0 1.214-1.058 1.607-2.535 1.607-2.197 0-4.997-.905-7.219-2.125v2.91c2.459 1.057 4.944 1.509 7.219 1.509 5.463 0 9.233-2.704 9.233-7.115-.025-7.5-9.594-6.173-9.594-9.002l.202.312zM60 6.37h-5.463V3.625l-5.722 1.22v1.525H46.56v4.015h2.255v6.355c0 2.564 1.239 4.164 4.478 4.164 1.222 0 2.64-.238 3.89-.594v-3.926c-.835.285-1.868.428-2.638.428-1.363 0-1.894-.476-1.894-1.666V10.39H60v11.264h5.722V10.385h3.247V6.37h-3.247V3.625L60 4.846V6.37zm-21.72 0l-.142-.5h-5.084V21.65h5.722V11.47c1.353-1.763 3.64-1.44 4.355-1.19V5.87c-.74-.285-3.448-.81-4.851 1.5V6.37zM26.56 21.65h5.722V5.87H26.56v15.78zm0-17.77h5.722V0H26.56v3.88zm-9.17 17.77h5.72V.428l-5.72 1.214V21.65z"
                  fill="#635bff"
                />
              </svg>
              <span className="text-stripe-slate font-semibold text-[15px]">
                Atlas
              </span>
              <span className="border-l border-stripe-border pl-3 text-stripe-slate-light text-sm font-normal">
                Founders Agreement
              </span>
            </a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
