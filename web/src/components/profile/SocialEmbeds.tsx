'use client';

import { useEffect, useRef } from 'react';

import { parseInstagramEmbed, parseTikTokEmbed } from '@/lib/social';

type SocialEmbedsProps = {
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
};

export function SocialEmbeds({ instagramUrl, tiktokUrl }: SocialEmbedsProps) {
  const ig = parseInstagramEmbed(instagramUrl ?? '');
  const tt = parseTikTokEmbed(tiktokUrl ?? '');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reload Instagram embed script when URL changes
    if (!ig.embedSrc) return;
    const existing = document.querySelector('script[data-flashtor-ig]');
    if (existing) existing.remove();
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.dataset.flashtorIg = '1';
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [ig.embedSrc]);

  if (!ig.embedSrc && !tt.embedSrc) return null;

  return (
    <div ref={wrapRef} className="grid gap-4 md:grid-cols-2">
      {ig.embedSrc ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm font-medium">
            <span>Instagram</span>
            {ig.profileUrl ? (
              <a href={ig.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600 underline">
                פתח בפרופיל
              </a>
            ) : null}
          </div>
          <iframe
            title="Instagram"
            src={ig.embedSrc}
            className="h-[480px] w-full border-0"
            loading="lazy"
            allow="encrypted-media; clipboard-write"
          />
        </div>
      ) : null}
      {tt.embedSrc ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm font-medium">
            <span>TikTok</span>
            {tt.profileUrl ? (
              <a href={tt.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600 underline">
                פתח בפרופיל
              </a>
            ) : null}
          </div>
          <iframe
            title="TikTok"
            src={tt.embedSrc}
            className="h-[480px] w-full border-0"
            loading="lazy"
            allow="encrypted-media; clipboard-write"
          />
        </div>
      ) : null}
    </div>
  );
}
