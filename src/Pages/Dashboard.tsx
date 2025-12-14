import { useState } from 'react'

type TimeRange = 'today' | 'week' | 'month'

const timeFilters: { id: TimeRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
]

const metricHighlights = [
  {
    id: 'orders',
    title: 'Open Orders',
    value: '48',
    subtitle: 'Serving 3120 guests',
    delta: '+12%',
    trend: 'up',
  },
  {
    id: 'prep',
    title: 'Kitchen Prep Progress',
    value: '76%',
    subtitle: '12 menus underway',
    delta: '+6%',
    trend: 'up',
  },
  {
    id: 'inventory',
    title: 'Critical Inventory Alerts',
    value: '5 items',
    subtitle: 'Needs attention today',
    delta: '-2',
    trend: 'down',
  },
  {
    id: 'feedback',
    title: 'Client Feedback Score',
    value: '4.8 / 5',
    subtitle: 'Last 30 services',
    delta: '+0.2',
    trend: 'up',
  },
]

const ordersInProgress = [
  {
    id: 'ORD-9213',
    client: 'Anika Foods',
    service: 'Corporate Lunch',
    guests: 180,
    schedule: '11:30 AM',
    status: 'prepping',
    crew: ['Kitchen', 'Logistics'],
  },
  {
    id: 'ORD-9207',
    client: 'Vista Weddings',
    service: 'Sangeet Dinner',
    guests: 420,
    schedule: '05:00 PM',
    status: 'plated',
    crew: ['Decor', 'Service'],
  },
  {
    id: 'ORD-9199',
    client: 'Urban Fest',
    service: 'Pop-up Kiosk',
    guests: 250,
    schedule: '07:15 PM',
    status: 'en-route',
    crew: ['Logistics'],
  },
  {
    id: 'ORD-9194',
    client: 'City Council',
    service: 'Working Breakfast',
    guests: 65,
    schedule: 'Tomorrow · 07:00 AM',
    status: 'scheduled',
    crew: ['Kitchen'],
  },
]

const serviceBreakdown = [
  {
    id: 'corporate',
    label: 'Corporate Catering',
    percent: 42,
    color: 'bg-orange-500',
  },
  { id: 'social', label: 'Social Events', percent: 33, color: 'bg-orange-400' },
  { id: 'weddings', label: 'Weddings', percent: 17, color: 'bg-orange-300' },
  {
    id: 'popups',
    label: 'Pop-up & Kiosks',
    percent: 8,
    color: 'bg-orange-200',
  },
]

const kitchenTimeline = [
  {
    id: 'prep',
    label: 'Mise en place',
    window: '06:00 - 09:30',
    completion: 68,
    owner: 'Prep Team',
  },
  {
    id: 'tasting',
    label: 'Menu tastings',
    window: '10:15 - 12:00',
    completion: 32,
    owner: 'QA Chef',
  },
  {
    id: 'dispatch',
    label: 'Dispatch & packing',
    window: '01:00 - 03:30',
    completion: 15,
    owner: 'Logistics',
  },
]

const inventoryAlerts = [
  {
    item: 'Chafing Fuel',
    level: '18 units',
    eta: 'Restock ETA 4h',
    severity: 'critical',
  },
  {
    item: 'Paneer Blocks',
    level: '62 kg',
    eta: 'Prep due 3h',
    severity: 'warning',
  },
  {
    item: 'Dessert Cups',
    level: '210 pcs',
    eta: 'Order placed',
    severity: 'info',
  },
]

const teamRoster = [
  {
    name: 'Ravi Natarajan',
    role: 'Head Chef',
    shift: '06:00 – 15:00',
    status: 'On station',
  },
  {
    name: 'Meera Prasad',
    role: 'Event Lead',
    shift: '09:00 – 18:00',
    status: 'Venue walk-through',
  },
  {
    name: 'Ajay Kumar',
    role: 'Logistics',
    shift: '08:00 – 17:00',
    status: 'Fleet loading',
  },
]

const statusTone: Record<string, string> = {
  prepping: 'bg-amber-50 text-amber-700',
  plated: 'bg-emerald-50 text-emerald-700',
  'en-route': 'bg-sky-50 text-sky-700',
  scheduled: 'bg-slate-100 text-slate-700',
}

const severityTone: Record<string, string> = {
  critical: 'text-rose-600 bg-rose-50',
  warning: 'text-amber-600 bg-amber-50',
  info: 'text-slate-500 bg-slate-50',
}

const CARD = 'rounded-md border border-slate-200 bg-white p-4'
const SLIM_CARD = 'rounded-md border border-slate-200 bg-white p-3'

export const Dashboard = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('today')
  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <main className="layout-container flex min-h-[95vh] w-full flex-col gap-6 rounded-md border border-slate-200 bg-white p-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Central Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            {todayLabel} · Chennai kitchens
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {timeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSelectedRange(filter.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedRange === filter.id
                  ? 'border-orange-500 bg-orange-100 text-orange-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricHighlights.map((metric) => (
          <article
            key={metric.id}
            className={`${CARD} flex min-h-[140px] flex-col justify-between gap-3`}
          >
            <p className="text-sm font-medium text-slate-500">{metric.title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">
                {metric.value}
              </span>
              <span
                className={`text-xs font-semibold ${metric.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {metric.delta}
              </span>
            </div>
            <p className="text-sm text-slate-500">{metric.subtitle}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <article className={CARD}>
          <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Orders in progress
              </h2>
              <p className="text-sm text-slate-500">
                Live kitchen & dispatch status
              </p>
            </div>
            <button
              className="text-sm font-semibold text-orange-600"
              type="button"
            >
              View routes →
            </button>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left text-sm">
              <thead className="text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Order</th>
                  <th className="py-2">Client</th>
                  <th className="py-2">Guests</th>
                  <th className="py-2">Schedule</th>
                  <th className="py-2">Crew</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersInProgress.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 font-semibold text-slate-800">
                      {order.service}
                    </td>
                    <td className="py-3 text-slate-600">{order.client}</td>
                    <td className="py-3 text-slate-600">{order.guests}</td>
                    <td className="py-3 text-slate-600">{order.schedule}</td>
                    <td className="py-3 text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {order.crew.map((crew) => (
                          <span
                            key={`${order.id}-${crew}`}
                            className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {crew}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[order.status]}`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={CARD}>
          <header className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Service mix
            </h2>
            <p className="text-sm text-slate-500">
              Distribution for selected range
            </p>
          </header>
          <div className="flex flex-col gap-4">
            {serviceBreakdown.map((service) => (
              <div key={service.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{service.label}</span>
                  <span className="font-semibold text-slate-900">
                    {service.percent}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className={`${service.color} h-2 rounded-full`}
                    style={{ width: `${service.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <article className={CARD}>
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Kitchen timeline
                </h2>
                <p className="text-sm text-slate-500">
                  Prep, QA and dispatch schedule
                </p>
              </div>
              <span className="text-xs tracking-wide text-slate-400 uppercase">
                Central facility
              </span>
            </header>
            <div className="flex flex-col gap-3">
              {kitchenTimeline.map((slot) => (
                <div key={slot.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {slot.label}
                      </p>
                      <p className="text-xs text-slate-500">{slot.window}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {slot.owner}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {slot.completion}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${slot.completion}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className={`${CARD} p-4`}>
            <header className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Team on duty
              </h3>
              <p className="text-sm text-slate-500">Shift board</p>
            </header>
            <div className="flex flex-col gap-3">
              {teamRoster.map((member) => (
                <div key={member.name} className={SLIM_CARD}>
                  <div className="flex flex-wrap items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">
                      {member.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {member.shift}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{member.role}</p>
                  <p className="text-xs font-semibold text-orange-600">
                    {member.status}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className={`${CARD} flex flex-col gap-5`}>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory alerts
            </h2>
            <p className="text-sm text-slate-500">
              Auto-generated from raw materials module
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {inventoryAlerts.map((alert) => (
              <div key={alert.item} className={SLIM_CARD}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-slate-900">
                    {alert.item}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${severityTone[alert.severity]}`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{alert.level}</p>
                <p className="text-xs text-slate-500">{alert.eta}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
