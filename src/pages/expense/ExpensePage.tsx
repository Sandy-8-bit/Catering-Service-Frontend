import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useFetchExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/queries/expenseQuery'
import type { Expense, ExpensePayload, ExpenseCategory } from '@/types/expense'

// Get categories dynamically
const getCategories = (): ExpenseCategory[] => [
  'RENT',
  'SUPPLIES',
  'SALARY',
  'UTILITIES',
  'OTHER',
]

const categoryColors: Record<ExpenseCategory, string> = {
  RENT: 'bg-blue-100 text-blue-700',
  SUPPLIES: 'bg-green-100 text-green-700',
  SALARY: 'bg-purple-100 text-purple-700',
  UTILITIES: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

const categoryIcons: Record<ExpenseCategory, string> = {
  RENT: '🏠',
  SUPPLIES: '📦',
  SALARY: '💼',
  UTILITIES: '⚡',
  OTHER: '📌',
}

export default function ExpensePage() {
  const { t } = useTranslation()
  const categories = getCategories()

  const [dateRange, setDateRange] = useState<{
    startDate?: string
    endDate?: string
  }>({})
  
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState<ExpenseCategory | null>(null)

  const { data: expenses = [], isLoading } = useFetchExpenses(dateRange)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [formError, setFormError] = useState<string>('')


  const [form, setForm] = useState<ExpensePayload>({
    description: '',
    amount: 0,
    category: 'OTHER',
    expenseDate: '',
    notes: '',
  })

  const openCreate = () => {
    setEditing(null)
    setFormError('')
    setForm({
      description: '',
      amount: 0,
      category: 'OTHER',
      expenseDate: '',
      notes: '',
    })
    setIsOpen(true)
  }

  const openEdit = (expense: Expense) => {
    setEditing(expense)
    setFormError('')
    setForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate,
      notes: expense.notes || '',
    })
    setIsOpen(true)
  }

  const handleSubmit = () => {
    setFormError('')

    if (!form.description.trim()) {
      setFormError('Description is required')
      return
    }

    if (!form.amount || form.amount <= 0) {
      setFormError('Amount must be greater than 0')
      return
    }

    if (!form.expenseDate) {
      setFormError('Date is required')
      return
    }

    if (editing) {
      updateExpense.mutate({
        id: editing.id,
        payload: form,
      })
    } else {
      createExpense.mutate(form)
    }

    setIsOpen(false)
    setForm({
      description: '',
      amount: 0,
      category: 'OTHER',
      expenseDate: '',
      notes: '',
    })
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const expenseCount = expenses.length

  return (
    <div className="min-h-screen  p-4 pb-24">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">{t('expenses')}</h1>
            <p className="text-sm text-slate-500">{t('manage_spending')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
         
            
            <button
              onClick={openCreate}
              className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm flex-1 sm:flex-none"
            >
              + {t('add_expense')}
            </button>
          </div>
        </div>

        {/* Date Filter Section - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            className="border px-3 py-2 rounded-lg text-sm flex-1 sm:flex-none"
            value={dateRange.startDate || ''}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                startDate: e.target.value || undefined,
              }))
            }
          />

          <input
            type="date"
            className="border px-3 py-2 rounded-lg text-sm flex-1 sm:flex-none"
            value={dateRange.endDate || ''}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                endDate: e.target.value || undefined,
              }))
            }
          />

          <button
            onClick={() => setDateRange({})}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {t('clear')}
          </button>
        </div>

        {/* Summary Cards */}
        {!isLoading && expenseCount > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                {t('total_expenses')}
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-slate-900">
                ₹ {totalExpenses.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                {t('transaction_count')}
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-slate-900">{expenseCount}</p>
            </div>
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                {t('average')}
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-slate-900">
                ₹ {Math.round(totalExpenses / expenseCount).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expenses List Section */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">{t('loading_expenses')}</p>
            </div>
          </div>
        ) : expenseCount === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-500 font-medium">{t('no_expenses_yet')}</p>
              <p className="text-sm text-slate-400 mt-1">
                {t('start_tracking_spending')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`text-2xl w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[exp.category].replace('text-', 'bg-').split(' ')[0]} bg-opacity-10`}
                  >
                    {categoryIcons[exp.category]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">
                        {exp.description}
                      </h3>
                      <span className={`${categoryColors[exp.category]} px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0`}>
                        {exp.category}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mb-2">
                      <p className="text-xs text-slate-500">
                        📅 {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>

                      {exp.notes && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          💬 {exp.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col sm:gap-1.5 shrink-0 w-full sm:w-auto">
                  <p className="text-base sm:text-lg font-bold text-orange-600 text-right sm:text-right">
                    ₹ {exp.amount.toLocaleString('en-IN')}
                  </p>

                  <div className="flex gap-1.5 sm:flex-col sm:gap-1.5">
                    <button
                      onClick={() => openEdit(exp)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-150 flex-1 sm:flex-none whitespace-nowrap"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            t('confirm_delete_expense')
                          )
                        ) {
                          deleteExpense.mutate(exp.id)
                        }
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition-colors duration-150 flex-1 sm:flex-none whitespace-nowrap"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  {editing ? t('edit_expense') : t('add_new_expense')}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-700 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-6 sm:px-6 flex flex-col gap-5">
              {/* Error Message */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-red-600 font-semibold text-sm shrink-0">⚠</span>
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* Description Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  {t('expense_description')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Office rent, Supplies purchase"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 placeholder-slate-400 text-sm"
                  value={form.description}
                  onChange={(e) => {
                    setForm({ ...form, description: e.target.value })
                    setFormError('')
                  }}
                />
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  {t('expense_amount')} <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 text-sm"
                    value={form.amount || ''}
                    onChange={(e) => {
                      setForm({ ...form, amount: Number(e.target.value) || 0 })
                      setFormError('')
                    }}
                  />
                </div>
              </div>

              {/* Category Select */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  {t('expense_category')} <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 bg-white text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as ExpenseCategory,
                    })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryIcons[cat]} {t(`expense_${cat.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  {t('expense_date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 text-sm"
                  value={form.expenseDate}
                  onChange={(e) => {
                    setForm({ ...form, expenseDate: e.target.value })
                    setFormError('')
                  }}
                />
              </div>

              {/* Notes Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  {t('expense_notes')} <span className="text-slate-400 font-normal">{t('expense_optional')}</span>
                </label>
                <textarea
                  placeholder={t('add_additional_details')}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 placeholder-slate-400 resize-none h-20 text-sm"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={
                    createExpense.isPending ||
                    updateExpense.isPending
                  }
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {createExpense.isPending || updateExpense.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editing ? t('updating') : t('creating')}
                    </>
                  ) : (
                    editing ? t('update_expense') : t('create_expense')
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:scale-in duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  {t('manage_categories')}
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(false)
                    setSelectedCategoryToDelete(null)
                  }}
                  className="text-slate-500 hover:text-slate-700 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-6 sm:px-6 flex flex-col gap-4">
              <p className="text-sm text-slate-600 mb-2">
                {t('category_management_info') || 'Manage expense categories'}
              </p>

              {/* Categories List */}
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      selectedCategoryToDelete === cat
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryIcons[cat]}</span>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm sm:text-base">
                          {t(`expense_${cat.toLowerCase()}`)}
                        </p>
                        <p className="text-xs text-slate-500">{cat}</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedCategoryToDelete(
                          selectedCategoryToDelete === cat ? null : cat
                        )
                      }
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedCategoryToDelete === cat
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedCategoryToDelete === cat
                        ? t('confirm_delete')
                        : t('delete')}
                    </button>
                  </div>
                ))}
              </div>

              {/* Warning */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  ℹ️ {t('category_delete_warning') || 'Categories are system-wide and cannot be deleted.'}
                </p>
              </div>

              {/* Close Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCategoryModal(false)
                    setSelectedCategoryToDelete(null)
                  }}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}