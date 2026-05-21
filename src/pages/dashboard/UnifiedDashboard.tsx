import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Camera,
  Video,
  Briefcase,
  Calendar,
  Database,
  Server,
  Shield,
  User,
  LogOut,
} from 'lucide-react';

interface RoleCard {
  role: string;
  label: string;
  path: string;
  icon: React.ElementType;
  color: string;
}

const roleCards: RoleCard[] = [
  { role: 'admin', label: 'Admin', path: '/admin/dashboard', icon: Shield, color: '#dc2626' },
  { role: 'master-admin', label: 'Master Admin', path: '/master-admin/sales/dashboard', icon: Shield, color: '#4f46e5' },
  { role: 'crm', label: 'CRM', path: '/crm/dashboard', icon: Users, color: '#7c3aed' },
  { role: 'pre-production-crm', label: 'Pre-production CRM', path: '/pre-production-crm/dashboard', icon: Camera, color: '#2563eb' },
  { role: 'post-production-crm', label: 'Post-production CRM', path: '/post-production-crm/dashboard', icon: Briefcase, color: '#d97706' },
  { role: 'event-coordinator', label: 'Event Coordinator', path: '/event-coordinator/dashboard', icon: Calendar, color: '#0891b2' },
  { role: 'photographer', label: 'Photographer', path: '/media/dashboard', icon: Camera, color: '#2563eb' },
  { role: 'videographer', label: 'Videographer', path: '/media/dashboard', icon: Video, color: '#059669' },
  { role: 'drone', label: 'Drone', path: '/media/dashboard', icon: Camera, color: '#0d9488' },
  { role: 'employee-1', label: 'Save the Date Post', path: '/employee/dashboard', icon: Briefcase, color: '#d97706' },
  { role: 'employee-2', label: 'Save the Date Video', path: '/employee/dashboard', icon: Briefcase, color: '#ea580c' },
  { role: 'employee-4', label: 'Outdoor Retouch', path: '/employee/dashboard', icon: Briefcase, color: '#65a30d' },
  { role: 'data-manager', label: 'Data Manager', path: '/data-manager/dashboard', icon: Database, color: '#4f46e5' },
  { role: 'operational-manager', label: 'Operational Manager', path: '/operational-manager/dashboard', icon: Server, color: '#7c3aed' },
  { role: 'traditional-video-editor', label: 'Traditional Video Editor', path: '/employee/dashboard', icon: Video, color: '#4338ca' },
  { role: 'retouch-editor', label: 'Retouch Editor', path: '/employee/dashboard', icon: Camera, color: '#0369a1' },
  { role: 'album-designer', label: 'Album Designer', path: '/employee/dashboard', icon: Briefcase, color: '#b45309' },
  { role: 'candid-video-editor', label: 'Candid Video Editor', path: '/employee/dashboard', icon: Video, color: '#db2777' },
  { role: 'client', label: 'Client', path: '/client/dashboard', icon: User, color: '#be123c' },
];

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name?: string; roles?: string[]; role?: string; profile_image?: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('ra_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const rawUserRoles = user?.roles || (user?.role ? [user.role] : []);
  const userRoles = Array.from(new Set(rawUserRoles.map(role => role === 'event-crm' ? 'post-production-crm' : role)));
  const availableCards = roleCards.filter(c => userRoles.includes(c.role));

  // If only one role, redirect directly
  useEffect(() => {
    if (availableCards.length === 1) {
      localStorage.setItem('ra_active_role', availableCards[0].role);
      navigate(availableCards[0].path, { replace: true });
    }
  }, [availableCards, navigate]);

  const handleRoleSelect = (card: RoleCard) => {
    localStorage.setItem('ra_active_role', card.role);
    navigate(card.path);
  };

  const handleLogout = () => {
    localStorage.removeItem('ra_token');
    localStorage.removeItem('ra_user');
    localStorage.removeItem('ra_active_role');
    navigate('/login');
  };

  if (!user || availableCards.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (availableCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">No dashboard assigned</h1>
          <p className="text-sm text-slate-500 mt-2">
            Your account is active, but none of its roles match an available dashboard.
          </p>
          <button
            onClick={handleLogout}
            className="mt-5 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-purple-600" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Welcome, {user.name || 'User'}
              </h1>
              <p className="text-sm text-slate-500">Select a dashboard to continue</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.role}
                onClick={() => handleRoleSelect(card)}
                className="group bg-white rounded-xl border border-slate-200 p-6 text-left hover:shadow-lg hover:border-transparent transition-all duration-200 hover:-translate-y-0.5"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <h3 className="text-base font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">
                  {card.label}
                </h3>
                <p className="text-sm text-slate-400 mt-1">Open dashboard</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
