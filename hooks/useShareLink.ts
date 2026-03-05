"use client";

import { useState, useCallback } from "react";

interface UseShareLinkOptions {
  slug: string;
  baseUrl?: string;
}

interface UseShareLinkReturn {
  url: string;
  copied: boolean;
  copy: () => Promise<void>;
  share: () => Promise<void>;
  canNativeShare: boolean;
}

export function useShareLink({
  slug,
  baseUrl,
}: UseShareLinkOptions): UseShareLinkReturn {
  const [copied, setCopied] = useState(false);

  const origin =
    baseUrl ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const url = `${origin}/r/${slug}`;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const share = useCallback(async () => {
    if (canNativeShare) {
      await navigator.share({
        title: "Tenés una invitación a jugar",
        text: "Unite a la cancha — ingresá con este link:",
        url,
      });
    } else {
      await copy();
    }
  }, [canNativeShare, url, copy]);

  return { url, copied, copy, share, canNativeShare };
}
