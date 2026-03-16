export default function Loading() {
  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1e3a5f] border-t-[#3b82f6]" />
        {/* Logo metni */}
        <p className="text-sm font-semibold text-[#4b5563]">
          Galya<span className="text-[#3b82f6]">Stream</span> yükleniyor...
        </p>
      </div>
    </div>
  );
}
