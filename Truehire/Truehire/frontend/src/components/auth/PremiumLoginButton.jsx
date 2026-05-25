import { motion } from 'framer-motion'

export default function PremiumLoginButton({ loading }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={loading ? undefined : { scale: 1.015, y: -1 }}
      whileTap={loading ? undefined : { scale: 0.985 }}
      className="relative flex min-h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f766e,#0ea5e9_52%,#2563eb)] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_24px_55px_-28px_rgba(37,99,235,0.95)] transition disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.26),transparent)] opacity-0 transition duration-500 hover:translate-x-full hover:opacity-100" />
      {loading ? (
        <span className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Signing in
        </span>
      ) : (
        'Login'
      )}
    </motion.button>
  )
}
