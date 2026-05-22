import { useLocation } from 'react-router-dom'

export type DataManagerStage = 'all' | 'pre_production' | 'event'

export const getDataManagerStageFromPath = (pathname: string): DataManagerStage => {
    if (pathname.includes('/data-manager/event/')) return 'event'
    if (pathname.includes('/data-manager/pre-production/')) return 'pre_production'
    return 'all'
}

export const getDataManagerStageLabel = (stage: DataManagerStage) => {
    if (stage === 'event') return 'Event'
    if (stage === 'pre_production') return 'Pre-production'
    return 'All'
}

export const matchesDataManagerStage = (item: any, stage: DataManagerStage) => {
    if (stage === 'all') return true
    const phase = String(item.current_phase || item.currentPhase || '').trim().toLowerCase()
    return phase === stage
}

export const useDataManagerStageScope = () => {
    const location = useLocation()
    const stage = getDataManagerStageFromPath(location.pathname)
    return {
        stage,
        label: getDataManagerStageLabel(stage),
    }
}

