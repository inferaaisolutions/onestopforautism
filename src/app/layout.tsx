import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import Transition from "@/components/Transition";

export const metadata: Metadata = {
  title: "ASD Guide",
  description: "A parent- and therapist-friendly guide to autism therapies, behaviors, and research from around the world.",
};

const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkConfigured = key.startsWith("pk_test_") || key.startsWith("pk_live_");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <DisclaimerBanner />
        <Header />
        <Transition>{children}</Transition>
        <Footer />
      </body>
    </html>
  );
  return clerkConfigured ? <ClerkProvider>{content}</ClerkProvider> : content;
}
