import type { ReactNode } from 'react'

interface StatCardProps {
    title: string
    value: string | number
    change?: string
    positive?: boolean
    icon: ReactNode
    iconBg: string
    subtitle?: string
    onClick?: () => void
    isActive?: boolean
}

export default function StatCard({ title, value, change, positive = true, icon, iconBg, subtitle, onClick, isActive }: StatCardProps) {
    return (
        <div 
            onClick={onClick}
            className={`crm-card p-5 flex flex-col gap-3 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''} ${isActive ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{title}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#111827' }}>{value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                    {icon}
                </div>
            </div>
            {subtitle ? (
                <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
                    {subtitle}
                </p>
            ) : change ? (
                <p className="text-xs font-medium" style={{ color: positive ? '#16a34a' : '#ef4444' }}>
                    {positive ? '↗' : '↘'} {change} vs last month
                </p>
            ) : null}
        </div>
    )
}
