import React from 'react'
import { Archive } from 'lucide-react'

interface BillTableColumn {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

interface BillTableProps {
  data: any[]
  columns: BillTableColumn[]
  messageWhenNoData?: string
}

const BillTable: React.FC<BillTableProps> = ({
  data,
  columns,
  messageWhenNoData = 'No data available',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-row items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-600 sm:text-sm">
        <Archive size={16} className="shrink-0 text-amber-300" />
        {messageWhenNoData}
      </div>
    )
  }

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-amber-300 bg-white">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="border-b-2 border-amber-300 bg-gradient-to-r from-amber-100 to-amber-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-xs font-bold text-amber-900 sm:text-sm md:text-base ${getAlignClass(column.align)}`}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-amber-200 transition-colors hover:bg-amber-50 ${
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'
              }`}
            >
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column.key}`}
                  className={`px-4 py-2.5 text-xs text-amber-900 sm:text-sm md:text-base ${getAlignClass(column.align)}`}
                  style={{ width: column.width }}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BillTable
