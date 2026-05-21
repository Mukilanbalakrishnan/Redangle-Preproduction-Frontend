import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const normalizeRole = (role: unknown) => {
  const key = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');

    const aliases: Record<string, string> = {
      'crm': 'crm',
      'preproduction-crm': 'pre-production-crm',
      'pre-production-crm': 'pre-production-crm',
      'pre-production-crm-admin': 'pre-production-crm',
      'pre-production-crm-manager': 'pre-production-crm',
      'postproduction-crm': 'post-production-crm',
      'post-production-crm': 'post-production-crm',
      'post-production-crm-admin': 'post-production-crm',
      'post-production-crm-manager': 'post-production-crm',
      'event-crm': 'post-production-crm',
      'event-crm-admin': 'post-production-crm',
      'event-crm-manager': 'post-production-crm',
      'master-admin': 'master-admin',
      'masteradmin': 'master-admin',
      'admin': 'admin',
    'event-coordinator': 'event-coordinator',
    'photographer': 'photographer',
    'videographer': 'videographer',
    'drone': 'drone',
    'data-management': 'data-manager',
    'data-manager': 'data-manager',
    'operational-manager': 'operational-manager',
    'traditional-video-editor': 'traditional-video-editor',
    'retouch-editor': 'retouch-editor',
    'album-designer': 'album-designer',
    'candid-video-editor': 'candid-video-editor',
    'save-the-date-post': 'employee-1',
    'save-the-date-video': 'employee-2',
    'outdoor-retouch': 'employee-4',
    'retouch-photo': 'employee-4',
    'employee-1': 'employee-1',
    'employee-2': 'employee-2',
    'employee-4': 'employee-4',
    'client': 'client',
  };

  return aliases[key] || key;
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [redirectPath, setRedirectPath] = useState<string>('/login');
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('ra_token');
    const userStr = localStorage.getItem('ra_user');

    if (!token || !userStr) {
      setAuthState('unauthenticated');
      return;
    }

    // Verify token with backend
    fetch('http://localhost:5001/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          // Support multi-role: use roles array, fall back to [role]
          const rawRoles: string[] = data.data?.roles && data.data.roles.length > 0
            ? data.data.roles
            : [data.data?.role || ''].filter(Boolean);
          const roles = Array.from(new Set(rawRoles.map(normalizeRole).filter(Boolean)));
          setUserRoles(roles);
          setRedirectPath(data.data?.redirectPath || '/login');
          setAuthState('authenticated');
          // Update stored user data with fresh data from server
          localStorage.setItem('ra_user', JSON.stringify({ ...data.data, roles, role: normalizeRole(data.data?.role) }));
          const activeRole = localStorage.getItem('ra_active_role');
          if (activeRole && activeRole !== 'multi-role' && !roles.includes(activeRole)) {
            localStorage.removeItem('ra_active_role');
          }
        } else {
          throw new Error('Verification failed');
        }
      })
      .catch(() => {
        // Token is invalid or expired — clear everything
        localStorage.removeItem('ra_token');
        localStorage.removeItem('ra_user');
        setAuthState('unauthenticated');
      });
  }, [location.pathname]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  // Role-based access check: user needs at least one matching role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.some(r => userRoles.includes(normalizeRole(r)))) {
    const target = redirectPath === location.pathname ? '/dashboard' : redirectPath;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
