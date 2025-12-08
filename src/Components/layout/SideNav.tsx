/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { appRoutes } from '@/routes/appRoutes'

const SideNav: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<string>('')

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

  return (
    <div
      style={{ zoom: 0.85 }}
      className={`floating-container relative flex min-h-screen bg-[#FAFAFA] transition-all duration-300`}
    >
      <motion.section
        className={`flex h-screen flex-col items-center justify-start gap-3 overflow-clip bg-[#FAFAFA] transition-all duration-300 select-none`}
        animate={{ x: 0, opacity: 1 }}
      >
        <motion.div
          className="main-navigation-items flex h-full flex-col items-center justify-start bg-[#FAFAFA] px-1.5 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="mt-1 flex flex-col items-center gap-3 overflow-y-auto bg-[#FAFAFA]">
            <img src="/icons/logo-icon.svg" className="mb-6 h-16 w-16" />
            <NavigationButton
              labelName="Dashboard"
              isActive={isRouteActive(appRoutes.dashboard.path)}
              iconSrc="/icons/sideNavIcons/dashboard-icon.svg"
              activeIconSrc="/icons/sideNavIcons/dashboard-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.dashboard.path)}
            />
            <NavigationButton
              labelName="Raw Materials"
              isActive={isRouteActive(appRoutes.rawMaterials.path)}
              iconSrc="/icons/sideNavIcons/rawMaterials-icon.svg"
              activeIconSrc="/icons/sideNavIcons/rawMaterials-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.rawMaterials.path)}
            />
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
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  labelName,
  isActive,
  iconSrc,
  activeIconSrc,
  onClick,
}) => {
  return (
    <div
      className="Navigation-button-container flex scale-90 flex-col items-center justify-center"
      onClick={onClick}
    >
      <div
        className={`Navigation-button-container ${isActive ? 'bg-orange-500 p-3 dark:bg-blue-400' : 'bg-white p-1.5 hover:bg-slate-100'} cursor-pointer rounded-[10px] transition-all duration-300 ease-in-out select-none`}
      >
        <img
          className="url"
          src={isActive ? activeIconSrc : iconSrc}
          alt={labelName}
        />
      </div>
      <h4
        className={`scale-95 text-center text-sm ${isActive ? 'font-medium text-slate-800' : 'font-medium text-slate-500'}`}
      >
        {labelName}
      </h4>
    </div>
  )
}
