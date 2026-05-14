/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Settings,
  BarChart3,
  Menu,
  ChevronLeft,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { appRoutes } from '@/routes/appRoutes'
import LogoutConfirmModal from './LogoutConfirmModal'

type NavigationSection = 'main' | 'orders' | 'settings'

interface NavigationItem {
  label: string
  path: string
  icon: React.ReactNode
  section: NavigationSection
}

const NAVIGATION_SECTIONS: Array<{ key: NavigationSection; titleKey: string }> = [
  { key: 'main', titleKey: 'side_nav_main_menu' },
  { key: 'orders', titleKey: 'side_nav_order_management' },
  { key: 'settings', titleKey: 'side_nav_settings' },
]

const SideNav: React.FC = () => {
  const { t } = useTranslation()
  const role = localStorage.getItem('CATERING_ROLE')
  const normalizedRole = (role ?? '').toUpperCase()

  if (normalizedRole === 'DRIVER') {
    return null
  }

  const [activeRoute, setActiveRoute] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

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
    return activeRoute.startsWith(route)
  }

  const navigationItems: NavigationItem[] = useMemo(() => {
const items: NavigationItem[] = [
  {
    label: t('side_nav_dashboard'),
    path: appRoutes.dashboard.path,
    icon: <LayoutDashboard className="h-6 w-6" />,
    section: 'main',
  },
  {
    label: t('side_nav_order_management'),
    path: appRoutes.orders.path,
    icon: <ShoppingCart className="h-6 w-6" />,
    section: 'orders',
  },
  {
    label: t('side_nav_expenses'),
    path: appRoutes.expenses.path,
    icon: <Wallet className="h-6 w-6" />,
    section: 'orders',
  },
  {
    label: t('side_nav_master_configuration'),
    path: appRoutes.master.path,
    icon: <Settings className="h-6 w-6" />,
    section: 'settings',
  },
  {
    label: t('side_nav_reports'),
    path: appRoutes.reports.path,
    icon: <BarChart3 className="h-6 w-6" />,
    section: 'settings',
  },
]

    if (normalizedRole === 'STAFF') {
      return items.filter((item) => item.path === appRoutes.orders.path)
    }

    return items
  }, [normalizedRole, t])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('CATERING_TOKEN')
    window.location.href = appRoutes.signInPage
  }, [])

  const toggleExpansion = () => setIsExpanded((prev) => !prev)
  const MobileNav: React.FC<{
    navigationItems: NavigationItem[]
    activeRoute: string
    navigateToRoute: (route: string) => void
    handleLogout: () => void
  }> = ({ navigationItems, activeRoute, navigateToRoute, handleLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false)

    const isRouteActive = (route: string) => activeRoute.startsWith(route)

    return (
      <div className="md:hidden">
        {/* 🔝 Top Nav */}
        <div className="flex items-center justify-between bg-white px-4 py-3 shadow-md">
          <span className="font-semibold text-slate-800">{t('side_nav_brand')}</span>
          <button onClick={() => setMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* 📂 Slide Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40">
            <div className="absolute top-0 right-0 h-full w-64 bg-white p-4 shadow-lg">
              <button
                className="mb-4 text-sm text-red-500"
                onClick={() => setMenuOpen(false)}
              >
                {t('close')}
              </button>

              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigateToRoute(item.path)
                    setMenuOpen(false)
                  }}
                  className={`block w-full rounded-lg px-4 py-2 text-left ${
                    isRouteActive(item.path)
                      ? 'bg-orange-100 font-semibold'
                      : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="mt-4 w-full rounded-lg bg-red-500 py-2 text-white"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        )}

      </div>
    )
  }

  return (
    <>
      <MobileNav
        navigationItems={navigationItems}
        activeRoute={activeRoute}
        navigateToRoute={navigateToRoute}
        handleLogout={handleLogout}
      />

      <div
        style={{ zoom: 0.85 }}
        className="floating-container bg-linear-to-br from-amber-50 via-white to-amber-50  relative hidden min-h-[125vh] border-r border-gray-200 bg-[#FAFAFA] md:flex"
      >
        <motion.section
          className={`flex h-[115vh] flex-col gap-4 overflow-hidden bg-amber-50  px-2.5 pt-4 transition-all duration-300 select-none ${isExpanded ? 'w-[280px]' : 'w-[100px]'}`}
          animate={{ x: 0, opacity: 1 }}
        >
          <motion.div
            className={`mt-1 flex w-full items-center ${isExpanded ? 'justify-between gap-3 rounded-xl border-2 border-[#eeeeee] bg-white p-2' : 'flex-col gap-3'} px-1.5`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
     <button
  onClick={() => toggleExpansion()}
  className={`${
    isExpanded
      ? 'h-14 w-14 self-center'
      : 'h-16 w-16 self-center'
  } flex items-center justify-center`}
>
  <img
    src="/icons/logo-icon.svg"
    alt="Logo"
    className="h-full w-full object-contain"
  />
</button>

            {isExpanded && (
              <div className="flex w-full flex-col">
                <span className="text-md min-w-max font-semibold text-slate-900">
                  {t('side_nav_brand')}
                </span>
                <span className="text-sm text-slate-500">{t('side_nav_admin')}</span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleExpansion}
              aria-label="Collapse navigation"
              className={`mr-2 cursor-pointer rounded-sm border-2 border-[#F1F1F1] p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none ${isExpanded ? '' : 'rotate-180'}`}
            >
              <ChevronLeft className="h-5 w-5" />
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
              {NAVIGATION_SECTIONS.map(({ key, titleKey }) => {
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
                        {t(titleKey)}
                      </h4>
                    )}
                    {sectionItems.map((item) => (
                      <NavigationButton
                        key={item.path}
                        labelName={item.label}
                        isActive={isRouteActive(item.path)}
                        icon={item.icon}
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
              onClick={() => setShowLogoutModal(true)}
              className={`mt-auto w-full cursor-pointer rounded-[12px] border-2 border-transparent text-red-600 transition-all duration-300 ease-in-out ${isExpanded ? 'flex items-center justify-start gap-3 px-3 py-2 hover:border-[#eeeeee] hover:bg-white' : 'flex flex-col items-center px-1.5 py-2 text-center'}`}
            >
              <div
                className={`flex items-center justify-center rounded-[10px] transition-all duration-200 ease-in-out ${isExpanded ? 'h-11 w-11 bg-white/30 text-red-500' : 'mb-1 h-12 w-12 text-red-500 hover:bg-red-100'}`}
              >
                <LogOut className="h-5 w-5" />
              </div>
              {isExpanded ? (
                <span className="text-base font-semibold">{t('logout')}</span>
              ) : (
                <h4 className="text-sm font-semibold">{t('logout')}</h4>
              )}
            </button>

            <LogoutConfirmModal
              open={showLogoutModal}
              onCancel={() => setShowLogoutModal(false)}
              onConfirm={() => {
                handleLogout()
                setShowLogoutModal(false)
              }}
            />
          </motion.div>
        </motion.section>
      </div>
    </>
  )
}

export default SideNav

interface NavigationButtonProps {
  labelName: string
  isActive: boolean
  icon: React.ReactNode
  onClick?: () => void
  isExpanded: boolean
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  labelName,
  isActive,
  icon,
  onClick,
  isExpanded,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`Navigation-button-container w-full cursor-pointer rounded-[12px] border-2 border-transparent transition-all duration-300 ease-in-out ${isExpanded ? `flex items-center justify-start gap-3 px-4 py-2 ${isActive ? 'border-2! border-[#eeeeee]! bg-white text-slate-600' : ''}` : `flex scale-90 flex-col items-center px-1.5 py-2 text-center`}`}
    >
      <div
        className={`flex items-center justify-center rounded-[10px] transition-all text-slate-600 ${isExpanded ? 'h-11 w-11 bg-white/20' : `mb-1 h-12 w-12 ${isActive ? 'bg-orange-500 text-white' : ''}`}`}
      >
        {icon}
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
