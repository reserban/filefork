import type { Metadata } from "next"
import { Sora } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/ThemeProvider"

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: {
    default: "FileFork - Compress images, videos, audio & PDFs in your browser",
    template: "%s · FileFork",
  },
  description:
    "FileFork compresses and converts images, videos, audio and PDFs entirely in your browser. No uploads, no accounts, open source.",
  applicationName: "FileFork",
  keywords: [
    "filefork",
    "image compression",
    "video compression",
    "audio compression",
    "pdf compression",
    "webp converter",
    "avif",
    "ffmpeg wasm",
    "client-side",
    "open source",
  ],
  authors: [{ name: "FileFork contributors" }],
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/symbol.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "FileFork",
    description: "Compress and convert images, videos, audio and PDFs in your browser.",
    type: "website",
    siteName: "FileFork",
  },
  twitter: {
    card: "summary_large_image",
    title: "FileFork",
    description: "Compress and convert images, videos, audio and PDFs in your browser.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="relative z-10">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
