/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react'
import { appRoutes } from '../../routes/appRoutes'
import { motion } from 'motion/react'

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

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     const target = e.target as HTMLElement

  //     if (
  //       target.tagName === 'INPUT' ||
  //       target.tagName === 'TEXTAREA' ||
  //       target.isContentEditable
  //     ) {
  //       return
  //     }

  //     if (/^[1-9]$/.test(e.key)) {
  //       e.preventDefault()
  //       const index = parseInt(e.key, 10) - 1
  //       if (navItems[index]) {
  //         navigateToRoute(navItems[index])
  //       }
  //     }
  //   }

  //   window.addEventListener('keydown', handleKeyDown)
  //   return () => window.removeEventListener('keydown', handleKeyDown)
  // }, [navItems, navigateToRoute])

  const isRouteActive = (route: string): boolean => {
    return activeRoute === route
  }

  return (
    <div
      style={{ zoom: 0.85 }}
      className={`floating-container bg:white relative flex h-screen border-r-2 border-gray-200 shadow-sm transition-all duration-300`}
    >
      <motion.section
        className={`flex h-screen flex-col items-center justify-center gap-3 overflow-clip bg-white transition-all duration-300 select-none`}
        animate={{ x: 0, opacity: 1 }}
      >
        <motion.div
          className="main-navigation-items flex h-full flex-col items-center justify-center px-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex flex-col gap-3 overflow-y-auto">
            <NavigationButton
              labelName="Dashboard"
              isActive={isRouteActive(appRoutes.dashboard.path)}
              iconSrc="/icons/sideNavIcons/dashboard-icon.svg"
              activeIconSrc="/icons/sideNavIcons/dashboard-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.dashboard.path)}
            />
            {/* <NavigationButton
              labelName="Employees"
              isActive={isRouteActive(appRoutes.employeesRoute.employees)}
              iconSrc="/icons/sideNavIcons/employees-icon.svg"
              activeIconSrc="/icons/sideNavIcons/employees-icon-active.svg"
              onClick={() =>
                navigateToRoute(appRoutes.employeesRoute.employees)
              }
            />
            <NavigationButton
              labelName="Attendance"
              isActive={isRouteActive(appRoutes.attendanceRoutes.attendance)}
              iconSrc="/icons/sideNavIcons/attendance-icon.svg"
              activeIconSrc="/icons/sideNavIcons/attendance-icon-active.svg"
              onClick={() =>
                navigateToRoute(appRoutes.attendanceRoutes.attendance)
              }
            />
            <NavigationButton
              labelName="Payroll"
              isActive={isRouteActive(appRoutes.PayrollRoutes.payroll)}
              iconSrc="/icons/sideNavIcons/payroll-icon.svg"
              activeIconSrc="/icons/sideNavIcons/payroll-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.PayrollRoutes.payroll)}
            />
            <NavigationButton
              labelName="Loan"
              isActive={isRouteActive(appRoutes.loanRoutes.loan)}
              iconSrc="/icons/sideNavIcons/loan-icon.svg"
              activeIconSrc="/icons/sideNavIcons/loan-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.loanRoutes.loan)}
            />
            <NavigationButton
              labelName="Approval"
              isActive={isRouteActive(appRoutes.approval)}
              iconSrc="/icons/sideNavIcons/approval-icon.svg"
              activeIconSrc="/icons/sideNavIcons/approval-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.approval)}
            />
            <NavigationButton
              labelName="Users"
              isActive={isRouteActive(appRoutes.users)}
              iconSrc="/icons/sideNavIcons/users-icon.svg"
              activeIconSrc="/icons/sideNavIcons/users-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.users)}
            />
            <NavigationButton
              labelName="Master"
              isActive={isRouteActive(appRoutes.masterRoutes.master)}
              iconSrc="/icons/sideNavIcons/master-icon.svg"
              activeIconSrc="/icons/sideNavIcons/master-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.masterRoutes.master)}
            />
            <NavigationButton
              labelName="Reports"
              isActive={isRouteActive(appRoutes.reports)}
              iconSrc="/icons/sideNavIcons/reports-icon.svg"
              activeIconSrc="/icons/sideNavIcons/reports-icon-active.svg"
              onClick={() => navigateToRoute(appRoutes.reports)}
            /> */}
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
        className={`Navigation-button-container ${isActive ? 'bg-blue-500 p-3 dark:bg-blue-400' : 'bg-white p-1.5 hover:bg-slate-100'} cursor-pointer rounded-[10px] transition-all duration-300 ease-in-out select-none`}
      >
        <img
          className="url"
          src={isActive ? activeIconSrc : iconSrc}
          alt={labelName}
        />
      </div>
      <h4
        className={`scale-95 text-sm ${isActive ? 'font-medium text-slate-800' : 'font-medium text-slate-500'}`}
      >
        {labelName}
      </h4>
    </div>
  )
}
