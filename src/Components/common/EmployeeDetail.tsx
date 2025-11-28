import { appRoutes } from '@/routes/appRoutes'
import { User } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

interface EmployeeProfileCardProps {
  employeeName: string
  employeeId: number
  employeeCode?: string
  profileUrl?: string | null
}

const EmployeeProfileCard: React.FC<EmployeeProfileCardProps> = ({
  employeeName,
  employeeCode,
  profileUrl,
  employeeId,
}) => {
  const random = React.useRef(Math.floor(Math.random() * 50)).current
  const navigate = useNavigate()
  const initials = employeeName
    ? employeeName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'NA'
  return (
    <div className="scrollbar-hide container flex flex-row items-center gap-2 overflow-scroll py-2">
      <div className="flex max-h-9 min-h-9 max-w-9 min-w-9 items-center justify-center overflow-clip rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
        {profileUrl ? (
          <img
            src={`https://randomuser.me/api/portraits/men/${random}.jpg`}
            alt=""
          />
        ) : (
          initials || <User className="h-5 w-5 text-slate-500" />
        )}
      </div>
      <div className="flex flex-col">
        <span
          onClick={() =>
            navigate(
              `${appRoutes.employeesRoute.children.staffProfile.replace(
                ':id',
                employeeId.toString()
              )}?state=display`
            )
          }
          className="text-sm font-semibold text-gray-700 hover:cursor-pointer hover:text-blue-700 hover:underline"
        >
          {employeeName}
        </span>
        {employeeCode && (
          <span className="text-xs text-gray-500">{employeeCode}</span>
        )}
      </div>
    </div>
  )
}

export default EmployeeProfileCard
