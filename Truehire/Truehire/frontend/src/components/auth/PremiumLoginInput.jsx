import { motion } from 'framer-motion'

export default function PremiumLoginInput({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  action,
}) {
  return (
    <label htmlFor={id} className="group block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <motion.div
        whileFocus={{ scale: 1.01 }}
        className="flex min-h-14 items-center rounded-2xl border border-slate-200/80 bg-white/80 px-4 shadow-[0_1px_0_rgba(15,23,42,0.04),0_14px_38px_-32px_rgba(15,23,42,0.45)] backdrop-blur transition duration-200 focus-within:border-cyan-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-400/15"
      >
        <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-focus-within:bg-cyan-50 group-focus-within:text-cyan-700">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-950 outline-none placeholder:text-slate-400"
        />
        {action ? <span className="ml-3 shrink-0">{action}</span> : null}
      </motion.div>
    </label>
  )
}
