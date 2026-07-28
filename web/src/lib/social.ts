/** Extract Instagram username or post path from a pasted URL / handle. */
export function parseInstagramEmbed(input: string): { username: string | null; embedSrc: string | null; profileUrl: string | null } {
  const raw = input.trim();
  if (!raw) return { username: null, embedSrc: null, profileUrl: null };

  let username: string | null = null;
  const handle = raw.match(/^@?([A-Za-z0-9._]{2,30})$/);
  if (handle) username = handle[1];

  const urlMatch = raw.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (urlMatch) {
    return {
      username: null,
      embedSrc: `https://www.instagram.com/p/${urlMatch[1]}/embed`,
      profileUrl: `https://www.instagram.com/p/${urlMatch[1]}/`,
    };
  }

  const profileMatch = raw.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (profileMatch && !['p', 'reel', 'tv', 'stories', 'explore'].includes(profileMatch[1].toLowerCase())) {
    username = profileMatch[1];
  }

  if (!username) return { username: null, embedSrc: null, profileUrl: raw.startsWith('http') ? raw : null };

  return {
    username,
    embedSrc: `https://www.instagram.com/${username}/embed`,
    profileUrl: `https://www.instagram.com/${username}/`,
  };
}

/** Extract TikTok username from URL / @handle. */
export function parseTikTokEmbed(input: string): { username: string | null; embedSrc: string | null; profileUrl: string | null } {
  const raw = input.trim();
  if (!raw) return { username: null, embedSrc: null, profileUrl: null };

  let username: string | null = null;
  const handle = raw.match(/^@?([A-Za-z0-9._]{2,24})$/);
  if (handle) username = handle[1];

  const profileMatch = raw.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i);
  if (profileMatch) username = profileMatch[1];

  if (!username) return { username: null, embedSrc: null, profileUrl: raw.startsWith('http') ? raw : null };

  return {
    username,
    embedSrc: `https://www.tiktok.com/embed/@${username}`,
    profileUrl: `https://www.tiktok.com/@${username}`,
  };
}

export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}`;
}

export function telLink(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}
