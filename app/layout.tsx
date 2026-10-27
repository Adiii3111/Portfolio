import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adiii · Aditya Kadlabal Sripad",
  description:
    "From Bengaluru to Boston — Aditya Kadlabal Sripad connects engineering, healthcare, supply chains, analytics, and research.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A1322" },
    { media: "(prefers-color-scheme: light)", color: "#F5F1E9" },
  ],
};

// Runs before first paint: skip the opening sequence for returning visitors
// in this tab session and for anyone who prefers reduced motion.
// Also picks the time-of-day mood (a saved choice, else the visitor's clock) so there's no flash.
// morning + afternoon use the light tone, evening + night the dark tone.
const introScript = `try{history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search);scrollTo(0,0)}catch(e){}try{if(sessionStorage.getItem("aks-intro")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="done"}catch(e){}var h=new Date().getHours(),t=h>=5&&h<11?"morning":h>=11&&h<17?"afternoon":h>=17&&h<20?"evening":"night",d=document.documentElement.dataset;d.time=t;d.theme=t==="morning"||t==="afternoon"?"light":"dark";`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
