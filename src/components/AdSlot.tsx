import React, { useEffect, useRef } from 'react';

// Google AdSense の広告枠。
// ビルド時に VITE_ADSENSE_CLIENT（ca-pub-…）と VITE_ADSENSE_SLOT（広告ユニット ID）が
// 両方あるときだけ表示する。未設定なら何も出さず、外部への読み込みも発生しない。
// ※ AdSense のポリシー上、タイピング修行のポップアップ内には置かないこと。
const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
const SLOT = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;
export const ADS_ENABLED = Boolean(CLIENT && SLOT);

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

let scriptRequested = false;
function loadAdSenseScript() {
  if (scriptRequested) return;
  scriptRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT!)}`;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}

export const AdSlot: React.FC<{ className?: string }> = ({ className = '' }) => {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADS_ENABLED || !insRef.current) return;
    loadAdSenseScript();
    // 同じ枠に二重で push するとエラーになるため、未処理の枠だけ埋める
    if (insRef.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 広告ブロッカーなどで失敗してもゲームには影響させない
    }
  }, []);

  if (!ADS_ENABLED) return null;
  return (
    <aside aria-label="広告" className={`w-full ${className}`}>
      <p className="text-[10px] font-bold text-[#979177] tracking-widest mb-1 font-mplus">広告</p>
      <ins
        ref={insRef}
        className="adsbygoogle block w-full min-h-[100px]"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
