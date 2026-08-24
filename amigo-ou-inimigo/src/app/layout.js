import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Amigo ou Inimigo",
    template: "%s | Amigo ou Inimigo",
  },
  description:
    "Organize seu evento, convide seus amigos e descubra seu resultado secreto.",
  applicationName: "Amigo ou Inimigo",
  openGraph: {
    title: "Amigo ou Inimigo",
    description:
      "Organize seu evento, convide seus amigos e descubra seu resultado secreto.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}