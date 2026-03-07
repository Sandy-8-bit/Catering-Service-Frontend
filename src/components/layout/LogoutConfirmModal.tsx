import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'

interface LogoutConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {t('logout_confirm_title')}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t('logout_confirm_message')}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-lg cursor-pointer border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {t('cancel')}
              </button>
              <button
                onClick={onConfirm}
                className="rounded-lg cursor-pointer bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t('logout')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LogoutConfirmModal
