"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const AUTH_PATHS = ["/sign-in", "/register"];

export function AuthRedirectFix() {
  const { isLoaded, userId } = useAuth();
  const pathname = usePathname();
  const previousUserId = useRef<string | null | undefined>(undefined);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      previousUserId.current = userId ?? null;
      return;
    }

    const justSignedIn = !previousUserId.current && userId;
    previousUserId.current = userId ?? null;

    if (!justSignedIn) return;

    if (AUTH_PATHS.some((path) => pathname.startsWith(path))) {
      window.location.assign("/nearby");
      return;
    }

    if (pathname.startsWith("/nearby")) {
      // Clerk soft-navigates here after auth; a hard reload ensures RSC data and
      // client widgets like Mapbox mount correctly without a manual refresh.
      window.location.reload();
    }
  }, [isLoaded, userId, pathname]);

  return null;
}
