import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import DropdownSelect, {
  type DropdownOption,
} from '@/components/common/DropDown'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const MONTH_OPTIONS: DropdownOption[] = MONTHS.map((label, index) => ({
  id: index + 1,
  label,
}))

const getYearsRange = (centerYear: number, span = 5) => {
  const years: number[] = []
  for (let year = centerYear - span; year <= centerYear + span; year += 1) {
    years.push(year)
  }
  return years
}

const getCalendarMatrix = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Convert Sunday=0 to Sunday=6 for Monday-first calendar
  const leadingEmptyDays = (firstDayOfMonth.getDay() + 6) % 7
  const trailingEmptyDays =
    (7 - ((lastDayOfMonth.getDay() + 6) % 7) - 1 + 7) % 7

  const totalCells =
    leadingEmptyDays + lastDayOfMonth.getDate() + trailingEmptyDays
  const days: Array<{ date: Date | null }> = []

  for (let i = 0; i < leadingEmptyDays; i += 1) {
    days.push({ date: null })
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day += 1) {
    days.push({ date: new Date(year, month, day) })
  }

  for (let i = 0; i < trailingEmptyDays; i += 1) {
    days.push({ date: null })
  }

  const weeks: Array<Array<{ date: Date | null }>> = []
  for (let i = 0; i < totalCells; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return weeks
}

export interface InlineCalendarProps {
  selectedDate?: Date | null
  onSelectDate?: (date: Date) => void
  initialViewDate?: Date
  className?: string
  showSelectedLabel?: boolean
}

const InlineCalendar = ({
  selectedDate,
  onSelectDate,
  initialViewDate,
  className = '',
  showSelectedLabel = true,
}: InlineCalendarProps) => {
  const today = useMemo(() => new Date(), [])
  const isControlled = typeof selectedDate !== 'undefined'

  const [viewDate, setViewDate] = useState(
    initialViewDate ?? selectedDate ?? today
  )
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(
    selectedDate ?? today
  )
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  useEffect(() => {
    if (isControlled) {
      setInternalSelectedDate(selectedDate ?? null)
      if (selectedDate) {
        setViewDate(
          () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        )
      }
    }
  }, [isControlled, selectedDate])

  const calendarMatrix = useMemo(() => getCalendarMatrix(viewDate), [viewDate])
  const years = useMemo(() => getYearsRange(viewDate.getFullYear()), [viewDate])
  const yearOptions = useMemo(
    () => years.map((year) => ({ id: year, label: year.toString() })),
    [years]
  )

  const selectedMonthOption = MONTH_OPTIONS[viewDate.getMonth()]
  const selectedYearOption = yearOptions.find(
    (option) => option.id === viewDate.getFullYear()
  ) ?? { id: viewDate.getFullYear(), label: viewDate.getFullYear().toString() }

  const currentSelected = internalSelectedDate

  const handleNavigate = (direction: 'prev' | 'next') => {
    setViewDate((prev) => {
      const nextMonth =
        direction === 'prev' ? prev.getMonth() - 1 : prev.getMonth() + 1
      return new Date(prev.getFullYear(), nextMonth, 1)
    })
  }

  const handleSelectDate = (date: Date | null) => {
    if (!date) return
    if (!isControlled) {
      setInternalSelectedDate(date)
    }
    onSelectDate?.(date)
  }

  const isSameDay = (first: Date | null, second: Date | null) => {
    if (!first || !second) return false
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    )
  }

  return (
    <section
      className={`w-full max-w-[470px] rounded-2xl border border-[#F1F1F1] bg-white p-4 shadow-sm transition-all sm:p-5 ${className}`}
      style={{ minWidth: 0 }}
    >
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="cursor-pointer rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100"
          onClick={() => handleNavigate('prev')}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 text-base font-semibold text-zinc-800"
          onClick={() => setIsPickerOpen((prev) => !prev)}
        >
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          <ChevronDown
            className={`h-4 w-4 transition ${
              isPickerOpen ? 'rotate-180 text-zinc-900' : 'text-zinc-500'
            }`}
          />
        </button>

        <button
          type="button"
          className="cursor-pointer rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100"
          onClick={() => handleNavigate('next')}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </header>

      {isPickerOpen && (
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 sm:flex-row">
          <DropdownSelect
            className="w-full"
            options={MONTH_OPTIONS}
            selected={selectedMonthOption}
            onChange={(option) => {
              const monthIndex = option.id - 1
              setViewDate((prev) => new Date(prev.getFullYear(), monthIndex, 1))
            }}
            placeholder="Select month"
            MainclassName="border-zinc-200"
          />

          <DropdownSelect
            className="w-full"
            options={yearOptions}
            selected={selectedYearOption}
            onChange={(option) => {
              setViewDate((prev) => new Date(option.id, prev.getMonth(), 1))
            }}
            placeholder="Select year"
            MainclassName="border-zinc-200"
          />
        </div>
      )}

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold tracking-wide text-zinc-400 uppercase">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {calendarMatrix.map((week, weekIndex) => (
          <div className="contents" key={`week-${weekIndex}`}>
            {week.map(({ date }, dayIndex) => {
              const key = date
                ? date.toISOString()
                : `empty-${weekIndex}-${dayIndex}`
              const isToday = isSameDay(date, today)
              const isSelected = isSameDay(date, currentSelected)
              const textColor = date ? 'text-zinc-800' : 'text-zinc-300'
              const stateClasses = !date
                ? 'cursor-default'
                : isSelected
                  ? 'cursor-pointer bg-[#4F46E5] font-semibold text-white shadow-sm'
                  : isToday
                    ? 'cursor-pointer border-2 border-[#4F46E5]/70 text-[#4F46E5]'
                    : 'cursor-pointer hover:bg-zinc-100'
              return (
                <button
                  type="button"
                  key={key}
                  className={`aspect-square rounded-xl text-sm transition ${stateClasses} ${
                    isSelected ? 'text-white' : textColor
                  }`}
                  onClick={() => handleSelectDate(date)}
                  disabled={!date}
                >
                  {date?.getDate() ?? ''}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {showSelectedLabel && currentSelected && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Selected:{' '}
          <span className="font-medium text-zinc-800">
            {MONTHS[currentSelected.getMonth()]} {currentSelected.getDate()},{' '}
            {currentSelected.getFullYear()}
          </span>
        </p>
      )}
    </section>
  )
}

export default InlineCalendar
