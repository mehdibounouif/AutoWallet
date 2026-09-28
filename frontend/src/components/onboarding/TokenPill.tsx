import { ChevronDown } from 'lucide-react'

interface TokenPillProps {
  value: string
  onChange: (val: string) => void
  options: string[]
  id?: string
}

export function TokenPill({ value, onChange, options, id }: TokenPillProps) {
  return (
    <div className="relative inline-flex items-center align-middle my-1">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-h-[36px] pl-3 pr-8 rtl:pr-3 rtl:pl-8 rounded-[10px] border border-[#DDE3EA] bg-white text-[#1A2330] font-semibold text-sm hover:border-[#5A64B4] focus:outline-none focus:border-[#5A64B4] focus:ring-2 focus:ring-[#5A64B4]/20 transition cursor-pointer appearance-none shadow-2xs"
        aria-label="Adjust rule value"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center px-2 text-[#5E6B7E]">
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </div>
  )
}
