import { useRecentNavStore } from '@/store/recentlySearchedItems'
import { ArrowRight } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export type ConfigCardtype = {
  img: string
  title: string
  desc: string
  label: string
  labelColor: string // e.g. "bg-blue-100 text-blue-800"
  btnText: string
  navigateUrl: string
}

const ConfigCard: React.FC<ConfigCardtype> = ({
  img,
  title,
  desc,
  label,
  labelColor,
  btnText,
  navigateUrl,
}) => {
  const navigate = useNavigate()
  const { addRecent, recentItems } = useRecentNavStore()

  return (
    <div
      onClick={() => {
        navigate(navigateUrl)
        addRecent({
          img,
          title,
          label,
          navigateUrl,
        })
      }}
      className="group w-full cursor-pointer rounded-xl bg-white px-4 py-5 shadow-sm transition-all duration-200 hover:scale-3d hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex h-full flex-col justify-between gap-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img src={img} alt="icon" className="h-7 w-7" />
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          </div>
          <span
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium ${labelColor}`}
          >
            {label}
          </span>
        </div>
        <p className="mb-3 text-sm font-medium text-slate-500">{desc}</p>
        <div className="jitems-center flex justify-between pt-1">
          <span className="rounded-xl bg-white text-sm font-medium text-white">
            {btnText}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  )
}

export default ConfigCard
