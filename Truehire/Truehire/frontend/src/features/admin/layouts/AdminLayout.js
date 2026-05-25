export default function AdminLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#140f0b] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_22%),radial-gradient(circle_at_78%_12%,_rgba(239,68,68,0.16),_transparent_26%),radial-gradient(circle_at_bottom,_rgba(217,119,6,0.12),_transparent_34%)]" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(245,158,11,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.2) 1px, transparent 1px)', backgroundSize: '46px 46px' }} />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
