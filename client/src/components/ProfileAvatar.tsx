import { useEffect, useState } from 'react';

export function ProfileAvatar({ url, name, className }: { url?: string | null; name: string; className: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => setFailedUrl(null), [url]);
  const initial = name.trim().slice(0, 1).toLocaleUpperCase('tr-TR') || 'N';
  return <div className={className} aria-label={`${name || 'Nova kullanıcısı'} profil görseli`}>
    {url && failedUrl !== url ? <img src={url} alt="" onError={() => setFailedUrl(url)} /> : initial}
  </div>;
}
