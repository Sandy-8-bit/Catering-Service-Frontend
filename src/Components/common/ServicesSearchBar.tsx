import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { appRoutes } from '@/routes/appRoutes'

interface ConfigOption {
  img: string
  title: string
  desc: string
  label: string
  labelColor: string
  onAction: () => void
}

const ERPConfigSearch = ({ className }: { className?: string }) => {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [filtered, setFiltered] = useState<ConfigOption[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)

  const CONFIG_OPTIONS: ConfigOption[] = [
    {
      img: '/icons/Configpage/Branch.svg',
      title: 'Branch',
      desc: 'Manage different office branches to streamline your organizational structure.',
      label: 'Organisation',
      labelColor: 'bg-red-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.branches),
    },
    {
      img: '/icons/Configpage/Department.svg',
      title: 'Department',
      desc: 'Define departments to better organize teams and responsibilities accross your branches.',
      label: 'Organisation',
      labelColor: 'bg-red-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.departments),
    },
    {
      img: '/icons/Configpage/Desigination.svg',
      title: 'Desigination',
      desc: 'Create and manage job titles and designations to clarify employee roles and hierarchy. ',
      label: 'HR Essentials',
      labelColor: 'bg-yellow-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.designations),
    },
    {
      img: '/icons/Configpage/Resigination.png',
      title: 'Resigination',
      desc: 'Track and manage employee resignations efficiently with proper records.',
      label: 'HR Essentials',
      labelColor: 'bg-yellow-500',
      onAction: () => navigate(appRoutes.employeesRoute.children.resignation),
    },
    {
      img: '/icons/Configpage/BloodGroup.svg',
      title: 'Blood Group',
      desc: 'Store employee blood group information for medical and emergency use.',
      label: 'HR Essentials',
      labelColor: 'bg-yellow-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.bloodGroups),
    },
    {
      img: '/icons/Configpage/Attendance.svg',
      title: 'Attendance',
      desc: 'Monitor and manage employee attendance records accurately',
      label: 'Attendance',
      labelColor: 'bg-green-500',
      onAction: () => navigate('/master/attendance'),
    },
    {
      img: '/icons/Configpage/Permission.svg',
      title: 'Permission',
      desc: 'Allow short-duration leave requests and approvals through permission logs',
      label: 'Attendance',
      labelColor: 'bg-green-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.permissions),
    },
    {
      img: '/icons/Configpage/Lop.svg',
      title: 'LOB',
      desc: 'Leave opening balance, Track leaves without pay and maintain data.',
      label: 'Attendance',
      labelColor: 'bg-green-500',
      onAction: () => console.log('Timesheet clicked'),
    },
    {
      img: '/icons/Configpage/Shift.svg',
      title: 'Shift',
      desc: 'Define work shifts and allocate employees accordingly.',
      label: 'Attendance',
      labelColor: 'bg-green-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.shifts),
    },
    {
      img: '/icons/Configpage/Holiday.svg',
      title: 'Holiday',
      desc: 'Plan and manage company-wide holidays and off days',
      label: 'Holiday & Benefits',
      labelColor: 'bg-purple-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.holidays),
    },
    {
      img: '/icons/Configpage/Loan.svg',
      title: 'Loan',
      desc: 'Track employee loans and repayment details with ease',
      label: 'Holiday & Benefits',
      labelColor: 'bg-purple-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.loans),
    },
    {
      img: '/icons/Configpage/Allowance.svg',
      title: 'Allowance',
      desc: 'Configure various allowances provided to employees beyond salary.',
      label: 'Holiday & Benefits',
      labelColor: 'bg-purple-500',
      onAction: () => navigate(appRoutes.masterRoutes.children.allowances),
    },
    {
      img: '/icons/Configpage/staff-profile.png',
      title: 'Staff Profile',
      desc: 'Manage different office branches to streamline your organizational structure.',
      label: 'HR Essentials',
      labelColor: 'bg-yellow-500',
      onAction: () => navigate(appRoutes.employeesRoute.children.staffsProfile),
    },
    {
      img: '/icons/Configpage/staff-rejoin.png',
      title: 'Staff Rejoin',
      desc: 'Create and manage job titles and designations to clarify employee roles and hierarchy. ',
      label: 'HR Essentials',
      labelColor: 'bg-yellow-500',
      onAction: () => navigate(appRoutes.employeesRoute.children.staffRejoin),
    },
    {
      img: '/icons/Configpage/branch-transfer.png',
      title: 'Branch Transfer',
      desc: 'Define departments to better organize teams and responsibilities accross your branches.',
      label: 'Organisation',
      labelColor: 'bg-red-500',
      onAction: () =>
        navigate(appRoutes.employeesRoute.children.branchTransfer),
    },
  ]

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const query = input.toLowerCase()
      setFiltered(
        query
          ? CONFIG_OPTIONS.filter((item) =>
              item.title.toLowerCase().includes(query)
            )
          : []
      )
      setSelectedIndex(-1)
    }, 200)
  }, [input])

  useEffect(() => {
    const el = suggestionsRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      filtered[selectedIndex].onAction()
      setIsFocused(false)
      setInput(selectedIndex === -1 ? '' : filtered[selectedIndex].title)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`relative mx-auto w-full max-w-2xl ${className}`}
    >
      <motion.div
        animate={{ scale: isFocused ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-lg bg-white"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <motion.div
            animate={{
              color: isFocused ? '#3b82f6' : '#6b7280',
              scale: isFocused ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <img className="w-5" src="/icons/search-icon.svg" alt="search" />
          </motion.div>
        </div>
        <input
          type="text"
          placeholder="Search configurations"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border-2 border-gray-200 py-3 pr-4 pl-12 text-sm font-medium text-slate-800 shadow-sm focus:border-transparent focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </motion.div>

      {isFocused && filtered.length > 0 && (
        <ul
          ref={suggestionsRef}
          className="absolute z-10 mt-2 max-h-[300px] w-full overflow-y-auto rounded-md border bg-white shadow-lg"
        >
          {filtered.map((item, idx) => (
            <li
              key={item.title}
              data-index={idx}
              onMouseDown={() => {
                item.onAction()
                setIsFocused(false)
                setInput(item.title)
              }}
              className={`flex cursor-pointer flex-row items-center gap-4 bg-white px-2 py-3 transition-all ${
                selectedIndex === idx ? 'bg-white' : 'hover:bg-gray-100'
              }`}
            >
              <img src={item.img} alt={item.title} className="h-8 w-8" />
              <div className="flex w-full flex-col">
                <div className="title flex w-full flex-row justify-between">
                  <h4 className="text-md font-medium text-slate-800">
                    {item.title}
                  </h4>
                  <span
                    className={`mt-1 w-max rounded px-2 py-0.5 text-xs text-white ${item.labelColor}`}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="line-clamp-1 w-[75%] text-gray-500">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

export default ERPConfigSearch
