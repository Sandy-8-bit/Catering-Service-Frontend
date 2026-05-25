import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useFetchExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/queries/expenseQuery'
import type { Expense, ExpensePayload, ExpenseCategory } from '@/types/expense'
import { ArrowLeft, Plus, Trash2, Pencil, X, AlertTriangle } from 'lucide-react'

const getCategories = (): ExpenseCategory[] => [
  'RENT', 'SUPPLIES', 'SALARY', 'MAINTENANCE', 'UTILITIES', 'TRANSPORTATION', 'STAFF', 'INSURANCE', 'MISCELLANEOUS',
]

const categoryColors: Record<ExpenseCategory, string> = {
  RENT: 'bg-blue-100 text-blue-700',
  SUPPLIES: 'bg-green-100 text-green-700',
  SALARY: 'bg-purple-100 text-purple-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  UTILITIES: 'bg-orange-100 text-orange-700',
  TRANSPORTATION: 'bg-red-100 text-red-700',
  STAFF: 'bg-indigo-100 text-indigo-700',
  INSURANCE: 'bg-pink-100 text-pink-700',
  MISCELLANEOUS: 'bg-gray-100 text-gray-700',
}

const categoryIcons: Record<ExpenseCategory, string> = {
  RENT: '🏠',
  SUPPLIES: '📦',
  SALARY: '💼',
  MAINTENANCE: '🔧',
  UTILITIES: '⚡',
  TRANSPORTATION: '🚗',
  STAFF: '👥',
  INSURANCE: '🛡️',
  MISCELLANEOUS: '📌',
}

export default function ExpensePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const categories = getCategories()

  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({})
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const { data: expenses = [], isLoading } = useFetchExpenses(dateRange)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState<ExpensePayload>({
    description: '',
    amount: 0,
    category: 'MISCELLANEOUS',
    expenseDate: '',
    notes: '',
  })

  const openCreate = () => {
    setEditing(null)
    setFormError('')
    setForm({ description: '', amount: 0, category: 'MISCELLANEOUS', expenseDate: '', notes: '' })
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
    if (!form.description.trim()) return setFormError('Description is required')
    if (!form.amount || form.amount <= 0) return setFormError('Amount must be greater than 0')
    if (!form.expenseDate) return setFormError('Date is required')

    if (editing) {
      updateExpense.mutate({ id: editing.id, payload: form })
    } else {
      createExpense.mutate(form)
    }

    setIsOpen(false)
    setForm({ description: '', amount: 0, category: 'MISCELLANEOUS', expenseDate: '', notes: '' })
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const expenseCount = expenses.length

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex flex-col gap-3">

          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col gap-0.5">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{t('expenses')}</h1>
                <p className="text-xs text-slate-400">{t('manage_spending')}</p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('add_expense')}
            </button>
          </div>

          {/* Date filter row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-0.5">
              <label className="text-xs text-slate-400 font-medium">From</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                value={dateRange.startDate || ''}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value || undefined }))}
              />
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <label className="text-xs text-slate-400 font-medium">To</label>
              <input
                type="date"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                value={dateRange.endDate || ''}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value || undefined }))}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-transparent font-medium">Clear</label>
              <button
                onClick={() => setDateRange({})}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                {t('clear')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="px-4 py-4 pb-8 flex flex-col gap-4">

        {/* Summary KPI Cards */}
        {!isLoading && expenseCount > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-orange-100">{t('total_expenses')}</p>
                <p className="text-xl font-bold text-white leading-none">
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm font-bold">₹</span>
              </div>
            </div>

            <div className="col-span-1 flex flex-col gap-2.5">
              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-0.5">
                <p className="text-base font-bold text-slate-900 leading-none">{expenseCount}</p>
                <p className="text-xs text-slate-400">{t('transaction_count')}</p>
              </div>
              <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-0.5">
                <p className="text-base font-bold text-slate-900 leading-none">
                  ₹{Math.round(totalExpenses / expenseCount).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-400">{t('average')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3 items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">{t('loading_expenses')}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && expenseCount === 0 && (
          <div className="flex flex-col gap-3 items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
              📊
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-700">{t('no_expenses_yet')}</p>
              <p className="text-xs text-slate-400">{t('start_tracking_spending')}</p>
            </div>
          </div>
        )}

        {/* Expense List */}
        {!isLoading && expenseCount > 0 && (
          <div className="flex flex-col gap-2.5">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shrink-0">
                      {categoryIcons[exp.category]}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{exp.description}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">
                          {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${categoryColors[exp.category]}`}>
                          {exp.category}
                        </span>
                      </div>
                      {exp.notes && (
                        <p className="text-xs text-slate-400 truncate">{exp.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <p className="text-sm font-bold text-orange-500">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(exp)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(exp.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{t('confirm_delete_expense')}</h3>
                  <p className="text-sm text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => { deleteExpense.mutate(deleteConfirm); setDeleteConfirm(null) }}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── ADD / EDIT BOTTOM SHEET ── */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto">

            {/* Sheet Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-bold text-slate-900">
                  {editing ? t('edit_expense') : t('add_new_expense')}
                </h2>
                <p className="text-xs text-slate-400">Fill in the details below</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Body */}
            <div className="px-4 py-5 flex flex-col gap-4">

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t('expense_description')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office rent, Supplies purchase"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  value={form.description}
                  onChange={(e) => { setForm({ ...form, description: e.target.value }); setFormError('') }}
                />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t('expense_amount')} <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                    value={form.amount || ''}
                    onChange={(e) => { setForm({ ...form, amount: Number(e.target.value) || 0 }); setFormError('') }}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t('expense_category')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                        form.category === cat
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base">{categoryIcons[cat]}</span>
                      <span>{t(`expense_${cat.toLowerCase()}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t('expense_date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                  value={form.expenseDate}
                  onChange={(e) => { setForm({ ...form, expenseDate: e.target.value }); setFormError('') }}
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t('expense_notes')}{' '}
                  <span className="text-slate-400 font-normal">({t('expense_optional')})</span>
                </label>
                <textarea
                  placeholder={t('add_additional_details')}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none h-16"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={createExpense.isPending || updateExpense.isPending}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {(createExpense.isPending || updateExpense.isPending) && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {editing ? t('update_expense') : t('create_expense')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}