import type { Metadata } from "next";
import { Work_Sans, Hind_Siliguri } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-work-sans",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hind-siliguri",
});

export const metadata: Metadata = {
  title: "MaaSheba Admin",
  description: "Internal MaaSheba AI admin dashboard",
};

const themeScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("maasheba.admin.theme");
    const cookie = document.cookie.match(/(?:^|; )maasheba_theme=([^;]+)/)?.[1];
    const theme = stored === "light" || cookie === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${hindSiliguri.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body-md bg-background text-on-background min-h-screen">
        {children}
      </body>
    </html>
  );
}
