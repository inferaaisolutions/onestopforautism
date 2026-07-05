import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import Transition from "@/components/Transition";

export const metadata: Metadata = {
  title: "ASD Guide",
  description: "A parent- and therapist-friendly guide to autism therapies, behaviors, and research from around the world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <DisclaimerBanner />
        <Header />
        <Transition>{children}</Transition>
        <Footer />
      </body>
    </html>
  );
}
