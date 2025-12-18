/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { LogOut } from 'lucide-react'
import { appRoutes } from '@/routes/appRoutes'

type NavigationSection = 'main' | 'orders' | 'settings'

interface NavigationItem {
  label: string
  path: string
  icon: string
  activeIcon: string
  section: NavigationSection
}

const NAVIGATION_SECTIONS: Array<{ title: string; key: NavigationSection }> = [
  { title: 'Main Menu', key: 'main' },
  { title: 'Order Management', key: 'orders' },
  { title: 'Settings', key: 'settings' },
]

const SideNav: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  useEffect(() => {
    const currentPath = window.location.pathname

    setActiveRoute(currentPath)
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
        section: 'main',
      },
      {
        label: 'Master Configuration',
        path: appRoutes.master.path,
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        activeIcon: '/icons/sideNavIcons/rawMaterials-icon-active.svg',
        section: 'main',
      },
      {
        label: 'Order Managmenet',
        path: appRoutes.orders.path,
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        activeIcon: '/icons/sideNavIcons/rawMaterials-icon-active.svg',
        section: 'orders',
      },
      {
        label: 'User Management',
        path: appRoutes.userManagement.path,
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        activeIcon: '/icons/sideNavIcons/rawMaterials-icon-active.svg',
        section: 'settings',
      },
    ],
    []
  )

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    window.location.href = appRoutes.signInPage
  }, [])

  const toggleExpansion = () => setIsExpanded((prev) => !prev)

  return (
    <div
      style={{ zoom: 0.85 }}
      className="floating-container relative flex min-h-[125vh] bg-[#FAFAFA] transition-all duration-300"
    >
      <motion.section
        className={`flex h-[115vh] flex-col gap-4 overflow-hidden bg-[#FAFAFA] px-2.5 pt-4 transition-all duration-300 select-none ${isExpanded ? 'w-[280px]' : 'w-[100px]'}`}
        animate={{ x: 0, opacity: 1 }}
      >
        <motion.div
          className={`mt-1 flex w-full items-center ${isExpanded ? 'justify-between gap-3 rounded-xl border-2 border-[#eeeeee] bg-white p-2' : 'flex-col gap-3'} px-1.5`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <img
            onClick={() => toggleExpansion()}
            src="/icons/logo-icon.svg"
            className={`${isExpanded ? 'h-14 w-14 self-center' : 'h-16 w-16 self-center'} `}
          />

          {isExpanded && (
            <div className="flex w-full flex-col">
              <span className="text-md min-w-max font-semibold text-slate-900">
                EBT Catering
              </span>
              <span className="text-sm text-slate-500">Admin</span>
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
          className="flex h-full w-full flex-col items-center justify-start self-stretch overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            className={`flex w-full flex-col ${isExpanded ? 'gap-0' : 'items-center gap-0'}`}
          >
            {NAVIGATION_SECTIONS.map(({ title, key }) => {
              const sectionItems = navigationItems.filter(
                (item) => item.section === key
              )

              if (sectionItems.length === 0) {
                return null
              }

              return (
                <React.Fragment key={key}>
                  {isExpanded && (
                    <h4 className="my-3 mt-2 px-3 text-sm font-medium text-slate-500">
                      {title}
                    </h4>
                  )}
                  {sectionItems.map((item) => (
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
                </React.Fragment>
              )
            })}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`mt-auto w-full cursor-pointer rounded-[12px] border-2 border-transparent text-red-600 transition-all duration-300 ease-in-out ${isExpanded ? 'flex items-center justify-start gap-3 px-3 py-2 hover:border-[#eeeeee] hover:bg-white' : 'flex flex-col items-center px-1.5 py-2 text-center'}`}
          >
            <div
              className={`flex items-center justify-center rounded-[10px] transition-all duration-200 ease-in-out ${isExpanded ? 'h-11 w-11 bg-white/30 text-red-500' : 'mb-1 h-12 w-12 text-red-500 hover:bg-red-100'}`}
            >
              <LogOut className="h-5 w-5" />
            </div>
            {isExpanded ? (
              <span className="text-base font-semibold">Logout</span>
            ) : (
              <h4 className="text-sm font-semibold">Logout</h4>
            )}
          </button>
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
  activeIconSrc,
}) => {
  // const activeClasses = isActive
  // ? 'bg-white text-slate-600 shadow-sm'
  // : 'hover:bg-slate-100 text-slate-700'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`Navigation-button-container w-full cursor-pointer rounded-[12px] border-2 border-transparent transition-all duration-300 ease-in-out ${isExpanded ? `flex items-center justify-start gap-3 px-3 py-2 ${isActive ? 'border-2! border-[#eeeeee]! bg-white text-slate-600' : ''}` : `flex scale-90 flex-col items-center px-1.5 py-2 text-center`}`}
    >
      <div
        className={`flex items-center justify-center rounded-[10px] transition-all ${isExpanded ? 'h-11 w-11 bg-white/20' : `mb-1 h-12 w-12 ${isActive ? 'bg-orange-500' : ''} `}`}
      >
        <img
          src={
            isExpanded
              ? iconSrc
              : isActive && activeIconSrc
                ? activeIconSrc
                : iconSrc
          }
          alt={labelName}
          className={`h-7 w-7 ${isExpanded && isActive ? 'brightness-75' : ''}`}
        />
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
