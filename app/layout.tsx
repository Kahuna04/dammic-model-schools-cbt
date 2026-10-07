import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MainContentWrapper from "@/components/MainContentWrapper";
import JsonLd from "./JsonLd";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Dammic Model Schools | Solid and steady steps to greatness",
  description: "Official website of Dammic Model Schools – Creche, Nursery, Primary and Secondary in Orile-Iloye, Sango Otta, Ogun State, Nigeria.",
  keywords: ["Dammic Model Schools", "school in Sango Otta", "Ogun State schools", "Orile-Iloye", "nursery school", "primary school", "secondary school", "creche Nigeria"],
  authors: [{ name: "Dammic Model Schools" }],
  openGraph: {
    title: "Dammic Model Schools - Quality Education Since 2005",
    description: "Creche, Nursery, Primary & Secondary. Solid and steady steps to greatness.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
      </head>
      <body>
        <Providers>
          <NavBar />
          <MainContentWrapper>{children}</MainContentWrapper>
          <Footer />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
