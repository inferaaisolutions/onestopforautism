"use client";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";

export default function AuthButtons() {
  const { isSignedIn } = useAuth();
  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <button className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700">
            Sign In
          </button>
        </SignInButton>
      )}
    </div>
  );
}
