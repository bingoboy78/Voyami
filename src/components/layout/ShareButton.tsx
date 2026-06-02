"use client";

import { useState } from 'react';
import { Share2, Copy, Check, QrCode, X } from 'lucide-react';

export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareData = {
      title: 'Наше путешествие',
      text: 'Присоединяйся к планированию нашей поездки! Маршрут, карта, расходы и чат здесь:',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Ссылка отправлена' }));
      } catch (err) {
        console.log('Web Share aborted or failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Ссылка скопирована в буфер обмена' }));
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const shareUrl = getShareUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <div className="flex gap-2 w-full">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-sm font-semibold text-text-primary transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-ok animate-pulse" /> : <Share2 className="w-4 h-4 text-primary" />}
          <span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
        </button>

        <button
          onClick={() => setShowQr(true)}
          className="px-3 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-text-primary transition-colors flex items-center justify-center"
          title="Показать QR-код"
        >
          <QrCode className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {showQr && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-surface border border-border rounded-[24px] shadow-2xl p-6 w-full max-w-sm overflow-hidden relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-tertiary hover:bg-surface-elevated hover:text-text-primary transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-[780] text-lg text-text-primary m-0 mt-2">
              Сканируй QR-код
            </h3>
            <p className="text-text-secondary text-xs mt-1.5 mb-5 max-w-[24ch]">
              Открой камеру телефона, чтобы быстро открыть это приложение на смартфоне
            </p>

            <div className="bg-white p-4 rounded-2xl border border-border shadow-inner mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-44 h-44 select-none"
                loading="lazy"
              />
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Ссылка скопирована' }));
                setShowQr(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 transition-opacity"
            >
              <Copy className="w-3.5 h-3.5" />
              Копировать ссылку
            </button>
          </div>
        </div>
      )}
    </>
  );
}
