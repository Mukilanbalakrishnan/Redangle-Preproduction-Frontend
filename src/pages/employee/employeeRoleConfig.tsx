import { Briefcase, Video, Camera, Image, Film } from 'lucide-react'
import type { ReactNode } from 'react'

export type EmployeeRole = 'employee-1' | 'employee-2' | 'employee-4' | 'traditional-video-editor' | 'retouch-editor' | 'album-designer' | 'candid-video-editor'

export interface RoleSpecificPage {
    title: string
    path: string
    icon: ReactNode
}

export interface RoleConfig {
    roleLabel: string
    specialPage: RoleSpecificPage
    createDesignDesc: string
}

const roleConfigs: Record<EmployeeRole, RoleConfig> = {
    'employee-1': {
        roleLabel: 'Save the Date Editor',
        specialPage: {
            title: 'Save the Date',
            path: '/employee/save-the-date',
            icon: <Briefcase size={20} />,
        },
        createDesignDesc: 'Start a new Save Date',
    },
    'employee-2': {
        roleLabel: 'Save the Video Editor',
        specialPage: {
            title: 'Save the Video',
            path: '/employee/save-the-video',
            icon: <Video size={20} />,
        },
        createDesignDesc: 'Start a new Save Video',
    },
    'employee-4': {
        roleLabel: 'Outdoor Pics Retoucher',
        specialPage: {
            title: 'Outdoor pics retouch',
            path: '/employee/outdoor-retouch',
            icon: <Briefcase size={20} />,
        },
        createDesignDesc: 'Start a new Retouch',
    },
    'traditional-video-editor': {
        roleLabel: 'Traditional Video Editor',
        specialPage: {
            title: 'Traditional Video Editing',
            path: '/employee/traditional-video/assigned-client',
            icon: <Video size={20} />,
        },
        createDesignDesc: 'Start a new Video Edit',
    },
    'retouch-editor': {
        roleLabel: 'Retouch Editor',
        specialPage: {
            title: 'Retouch Editing',
            path: '/employee/traditional-photo/assigned-client',
            icon: <Camera size={20} />,
        },
        createDesignDesc: 'Start a new Photo Edit',
    },
    'album-designer': {
        roleLabel: 'Album Designer',
        specialPage: {
            title: 'Album Design',
            path: '/employee/album-design/assigned-client',
            icon: <Image size={20} />,
        },
        createDesignDesc: 'Start a new Album Design',
    },
    'candid-video-editor': {
        roleLabel: 'Candid Video Editor',
        specialPage: {
            title: 'Candid Video Editing',
            path: '/employee/candid-video/assigned-client',
            icon: <Film size={20} />,
        },
        createDesignDesc: 'Start a new Candid Video Edit',
    },
}

export function getRoleConfig(role: string): RoleConfig {
    return roleConfigs[role as EmployeeRole] || roleConfigs['employee-1']
}

export function getEmployeeRole(): EmployeeRole {
    try {
        const userStr = localStorage.getItem('ra_user')
        if (userStr) {
            const user = JSON.parse(userStr)
            const roles: string[] = user.roles || [user.role].filter(Boolean)
            const employeeRoles = roles.filter((r: string) => r in roleConfigs)
            const activeRole = localStorage.getItem('ra_active_role')

            if (activeRole && employeeRoles.includes(activeRole)) {
                return activeRole as EmployeeRole
            }

            if (activeRole && activeRole in roleConfigs && !employeeRoles.includes(activeRole)) {
                localStorage.removeItem('ra_active_role')
            }

            const employeeRole = roles.find((r: string) => r in roleConfigs)
            if (employeeRole) {
                localStorage.setItem('ra_active_role', employeeRole)
                return employeeRole as EmployeeRole
            }
        }
    } catch {
        // fallback
    }
    return 'employee-1'
}
