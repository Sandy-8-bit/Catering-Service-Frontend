/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { appRoutes } from '@/routes/appRoutes'

interface NavigationItem {
  label: string
  path: string
  icon: string
  activeIcon: string
}

const SideNav: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  useEffect(() => {
    const currentPath = window.location.pathname

    if (currentPath.startsWith('/master')) {
      setActiveRoute(appRoutes.dashboard.path)
    } else {
      setActiveRoute(currentPath)
    }
  }, [])

  const navigateToRoute = useCallback((route: string) => {
    setActiveRoute(route)
    window.history.pushState({}, '', route)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  const isRouteActive = (route: string): boolean => {
    return activeRoute === route
  }

  const navigationItems: NavigationItem[] = useMemo(
    () => [
      {
        label: 'Dashboard',
        path: appRoutes.dashboard.path,
        icon: '/icons/sideNavIcons/dashboard-icon.svg',
        activeIcon: '/icons/sideNavIcons/dashboard-icon-active.svg',
      },
      {
        label: 'Raw Materials',
        path: appRoutes.rawMaterials.path,
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        activeIcon: '/icons/sideNavIcons/rawMaterials-icon-active.svg',
      },
    ],
    []
  )

  const activePageTitle = useMemo(() => {
    const activeItem = navigationItems.find((item) => item.path === activeRoute)
    return activeItem?.label ?? 'Navigation'
  }, [activeRoute, navigationItems])

  const toggleExpansion = () => setIsExpanded((prev) => !prev)

  return (
    <div
      style={{ zoom: 0.85 }}
      className="floating-container relative flex min-h-screen bg-[#FAFAFA] transition-all duration-300"
    >
      <motion.section
        className={`flex h-screen flex-col gap-4 overflow-hidden bg-[#FAFAFA] px-2 pt-4 transition-all duration-300 select-none ${isExpanded ? 'w-[280px]' : 'w-[120px]'}`}
        animate={{ x: 0, opacity: 1 }}
      >
        <motion.div
          className={`mt-1 flex w-full items-center ${isExpanded ? 'justify-between gap-3 rounded-xl border-2 border-[#F1F1F1] bg-white p-2 shadow-sm' : 'flex-col gap-3'} px-1.5`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <img
            onClick={() => toggleExpansion()}
            src="/icons/logo-icon.svg"
            className={`${isExpanded ? 'h-14 w-14' : 'h-16 w-16'} `}
          />

          {isExpanded && (
            <div className="flex w-full flex-col">
              <span className="text-md font-semibold text-slate-900">
                Uxerflow Inc.
              </span>
              <span className="text-xs text-slate-500">Free Plan</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleExpansion}
            aria-label="Collapse navigation"
            className={`mr-2 cursor-pointer rounded-sm border-2 border-[#F1F1F1] p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none ${isExpanded ? '' : 'rotate-180'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </button>
        </motion.div>
        <motion.div
          className="flex h-full w-full flex-col items-center justify-start overflow-y-auto px-1.5 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            className={`mt-4 flex w-full flex-col ${isExpanded ? 'gap-2' : 'items-center gap-3'}`}
          >
            {navigationItems.map((item) => (
              <NavigationButton
                key={item.path}
                labelName={item.label}
                isActive={isRouteActive(item.path)}
                iconSrc={item.icon}
                activeIconSrc={item.activeIcon}
                onClick={() => navigateToRoute(item.path)}
                isExpanded={isExpanded}
              />
            ))}
          </div>
        </motion.div>
      </motion.section>
    </div>
  )
}

export default SideNav

interface NavigationButtonProps {
  labelName: string
  isActive: boolean
  iconSrc: string
  activeIconSrc?: string
  onClick?: () => void
  isExpanded: boolean
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  labelName,
  isActive,
  iconSrc,
  onClick,
  isExpanded,
}) => {
  const activeClasses = isActive
    ? 'bg-white text-slate-600 shadow-sm'
    : 'hover:bg-slate-100 text-slate-700'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`Navigation-button-container w-full cursor-pointer rounded-[12px] transition-all duration-300 ease-in-out ${activeClasses} ${isExpanded ? 'flex items-center justify-start gap-3 px-3 py-2' : `flex scale-90 flex-col items-center px-1.5 py-2 text-center ${isActive ? 'bg-' : ''}`}`}
    >
      <div
        className={`flex items-center justify-center rounded-[10px] transition-all ${isExpanded ? 'h-11 w-11 bg-white/20' : 'mb-1 h-12 w-12'}`}
      >
        <img src={iconSrc} alt={labelName} className="h-7 w-7 brightness-75" />
      </div>
      {isExpanded ? (
        <span
          className={`text-base ${isActive ? 'font-semibold' : 'font-medium'} text-slate-700`}
        >
          {labelName}
        </span>
      ) : (
        <h4 className={`scale-95 text-sm font-medium text-slate-700`}>
          {labelName}
        </h4>
      )}
    </button>
  )
}
