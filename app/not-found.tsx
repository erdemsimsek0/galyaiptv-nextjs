import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 büyük rakam */}
        <div className="mb-2 text-8xl font-black text-[#1e3a5f] select-none">404</div>

        <h1 className="mb-3 text-2xl font-bold text-white">Sayfa Bulunamadı</h1>
        <p className="mb-8 text-sm leading-relaxed text-[#9ca3af]">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/25 transition-all hover:bg-[#2563eb] hover:scale-[1.02]"
          >
            Ana Sayfaya Dön →
          </Link>
          <a
            href="https://wa.me/447441921660"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#1e3a5f] bg-[#111827] px-6 py-3 text-sm font-semibold text-[#25d366] transition-all hover:border-[#25d366]/30"
          >
            💬 WhatsApp Destek
          </a>
        </div>

        {/* Faydalı linkler */}
        <div className="mt-10 border-t border-[#1e3a5f] pt-8">
          <p className="mb-4 text-xs text-[#4b5563]">Faydalı sayfalar:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: '/#paketler', label: 'Paketler' },
              { href: '/#sss', label: 'S.S.S' },
              { href: '/kurulum-rehberi', label: 'Kurulum Rehberi' },
              { href: '/blog', label: 'Blog' },
              { href: '/iletisim', label: 'İletişim' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-[#1e3a5f] bg-[#111827] px-3 py-1.5 text-xs text-[#9ca3af] transition-colors hover:border-[#3b82f6]/30 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
