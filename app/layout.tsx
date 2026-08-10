import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { AuthSessionKeepalive } from "@/components/auth-session-keepalive";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inkling",
  description: "A playful personal notebook for notes, sketches, and to-dos.",
  applicationName: "Inkling",
  appleWebApp: {
    capable: true,
    title: "Inkling",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionKeepalive />
        {children}
      </body>
    </html>
  );
}
