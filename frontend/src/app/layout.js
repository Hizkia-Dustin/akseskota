import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import "mapbox-gl/dist/mapbox-gl.css";

import SmoothScroll from "./components/SmoothScroll";
import PageTransitionProvider from "./components/PageTransitionProvider";
import SiteIntro from "./components/SiteIntro";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata = {
  title: "AksesKota — Navigasi Inklusif",
  description:
    "Temukan rute pejalan kaki yang aman, nyaman, dan sesuai kebutuhan aksesibilitasmu.",
  applicationName: "AksesKota",
  icons: {
    icon: [
      {
        url: "/brand/akseskota-icon.svg?v=1",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/brand/akseskota-icon.svg?v=1",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('akseskota-intro-v1'))document.documentElement.dataset.introSeen='true'}catch(e){}",
          }}
        />
      </head>
      <body className={jakarta.className}>
        <SiteIntro />
        <PageTransitionProvider>
          <SmoothScroll />
          {children}
        </PageTransitionProvider>
      </body>
    </html>
  );
}
