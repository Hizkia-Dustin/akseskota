import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import "mapbox-gl/dist/mapbox-gl.css";

import SmoothScroll from "./components/SmoothScroll";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata = {
  title: "AksesKota — Navigasi Inklusif",
  description:
    "Temukan rute pejalan kaki yang aman, nyaman, dan sesuai kebutuhan aksesibilitasmu.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className={jakarta.className}>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
