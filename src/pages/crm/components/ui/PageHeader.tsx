import type { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle: string
    action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
