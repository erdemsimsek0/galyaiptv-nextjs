'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hata loglama servisi varsa buraya eklenebilir
    console.error('Uygulama hatası:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07111f] px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-3xl">
            ⚠️
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Bir hata oluştu</h2>
        <p className="text-sm text-[#9ca3af] mb-6 leading-relaxed">
          Üzgünüz, beklenmedik bir sorun çıktı. Sayfayı yenilemeyi deneyin veya{' '}
          <a
            href="https://wa.me/447441921660"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25d366] underline hover:text-[#1ebe5d]"
          >
            WhatsApp destek hattımızdan
          </a>{' '}
          yardım alın.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
          >
            Tekrar Dene
          </button>
          <a
            href="/"
            className="rounded-xl border border-[#1e3a5f] bg-[#111827] px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#3b82f6]/40"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}
