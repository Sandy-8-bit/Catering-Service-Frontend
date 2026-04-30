import { useState } from 'react'
import {
  useFetchExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/queries/expenseQuery'
import type { Expense, ExpensePayload, ExpenseCategory } from '@/types/expense'

const categories: ExpenseCategory[] = [
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
  const { data: expenses = [], isLoading } = useFetchExpenses()
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
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-slate-900">Expenses</h1>
            <p className="text-sm text-slate-500">Manage your spending</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
          >
            + Add Expense
          </button>
        </div>

        {/* Summary Cards */}
        {!isLoading && expenseCount > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Total Expenses
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                ₹ {totalExpenses.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Transaction Count
              </p>
              <p className="text-2xl font-semibold text-slate-900">{expenseCount}</p>
            </div>
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Average
              </p>
              <p className="text-2xl font-semibold text-slate-900">
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
              <p className="text-sm text-slate-500">Loading expenses...</p>
            </div>
          </div>
        ) : expenseCount === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-500 font-medium">No expenses yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Start tracking your spending by adding an expense
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`text-2xl w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColors[exp.category].replace('text-', 'bg-').split(' ')[0]} bg-opacity-10`}
                  >
                    {categoryIcons[exp.category]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {exp.description}
                      </h3>
                      <span className={`${categoryColors[exp.category]} px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0`}>
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

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <p className="text-lg font-bold text-orange-600 text-right">
                    ₹ {exp.amount.toLocaleString('en-IN')}
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => openEdit(exp)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-150 whitespace-nowrap"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Are you sure you want to delete this expense?'
                          )
                        ) {
                          deleteExpense.mutate(exp.id)
                        }
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 transition-colors duration-150 whitespace-nowrap"
                    >
                      Delete
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
                <h2 className="text-xl font-semibold text-slate-900">
                  {editing ? 'Edit Expense' : 'Add New Expense'}
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
                  <span className="text-red-600 font-semibold text-sm flex-shrink-0">⚠</span>
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* Description Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Office rent, Supplies purchase"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 placeholder-slate-400"
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
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900"
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
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 bg-white"
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
                      {categoryIcons[cat]} {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900"
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
                  Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="Add any additional details..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-150 text-slate-900 placeholder-slate-400 resize-none h-20"
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
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {createExpense.isPending || updateExpense.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editing ? 'Update Expense' : 'Create Expense'
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}