import React from 'react'

const KPICard = ({
  label,
  value,
  icon: Icon,
  subtext,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  subtext?: string
}) => (
  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white px-6 py-4 shadow-sm ring-1 ring-amber-200 transition-all hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="mb-1 text-xs font-semibold tracking-wider text-amber-600 uppercase">
          {label}
        </p>
        <p className="text-2xl font-bold text-amber-900">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
      <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        {Icon}
      </div>
    </div>
  </div>
)

export default KPICard
