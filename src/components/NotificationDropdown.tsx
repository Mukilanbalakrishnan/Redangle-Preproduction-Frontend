import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Users, CheckCircle2, Calendar, MessageSquare, Briefcase,
    UserPlus, FileText, Camera, Send, X, Check
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../hooks/useNotifications';
import { getNotificationTargetPath } from '../utils/notificationNavigation';

// Map notification types to icons and colors
const getNotificationStyles = (type: string) => {
    switch (type) {
        case 'query':
            return { icon: MessageSquare, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', dot: 'bg-purple-500' };
        case 'assignment_accepted':
            return { icon: CheckCircle2, iconBg: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-500' };
        case 'client':
        case 'new_client':
            return { icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-500' };
        case 'leave':
        case 'leave_request':
            return { icon: Calendar, iconBg: 'bg-red-100', iconColor: 'text-red-500', dot: 'bg-red-500' };
        case 'employee':
        case 'new_employee':
            return { icon: UserPlus, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', dot: 'bg-indigo-500' };
        case 'delivery':
        case 'client_delivery':
            return { icon: Send, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', dot: 'bg-teal-500' };
        case 'work_assigned':
        case 'assignment':
            return { icon: FileText, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', dot: 'bg-orange-500' };
        case 'shoot':
        case 'shoot_assigned':
            return { icon: Camera, iconBg: 'bg-pink-100', iconColor: 'text-pink-600', dot: 'bg-pink-500' };
        case 'raw_data_uploaded':
            return { icon: Camera, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-500' };
        default:
            return { icon: Briefcase, iconBg: 'bg-gray-100', iconColor: 'text-gray-600', dot: 'bg-gray-400' };
    }
};

const timeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
};

const getDateLabel = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' });
};

interface NotificationDropdownProps {
    role: string;
    bellSize?: number;
    notificationsPath: string;
}

export default function NotificationDropdown({ role, bellSize = 20, notificationsPath }: NotificationDropdownProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { notifications, loading, unreadCount, handleMarkRead, handleMarkAllRead } = useNotifications(role);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset tab to 'all' when dropdown opens
    useEffect(() => {
        if (showDropdown) setActiveTab('all');
    }, [showDropdown]);

    const filtered = activeTab === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const displayNotifications = filtered.slice(0, 15);

    // Group by date label
    const grouped: { label: string; items: NotificationItem[] }[] = [];
    for (const note of displayNotifications) {
        const label = getDateLabel(note.created_at);
        const existing = grouped.find(g => g.label === label);
        if (existing) existing.items.push(note);
        else grouped.push({ label, items: [note] });
    }

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-2 rounded-xl transition-all duration-200 ${
                    showDropdown
                        ? 'bg-purple-100 text-purple-600 shadow-sm'
                        : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title="Notifications"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
                <Bell size={bellSize} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 border-2 border-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {showDropdown && (
                <div
                    className="absolute top-full right-0 mt-2 w-[390px] bg-white rounded-2xl shadow-2xl overflow-hidden z-[9999] border border-gray-100"
                    style={{ animation: 'notifPopIn 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
                >
                    {/* Header */}
                    <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[15px] font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                                <Bell size={15} className="text-purple-500" />
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full ml-1">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-all"
                                        title="Mark all as read"
                                    >
                                        <Check size={11} strokeWidth={3} />
                                        All read
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                    aria-label="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                            {(['all', 'unread'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all duration-150 capitalize ${
                                        activeTab === tab
                                            ? 'bg-white text-purple-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                <p className="text-xs text-gray-400 font-medium">Loading notifications...</p>
                            </div>
                        ) : displayNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6">
                                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                    <Bell size={24} className="text-gray-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-500">
                                    {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {activeTab === 'unread' ? 'You have no unread notifications.' : "We'll notify you when something arrives."}
                                </p>
                            </div>
                        ) : (
                            <div>
                                {grouped.map(group => (
                                    <div key={group.label}>
                                        <div className="sticky top-0 z-10 px-5 py-1.5 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{group.label}</span>
                                        </div>
                                        {group.items.map((note: NotificationItem) => {
                                            const { icon: Icon, iconBg, iconColor, dot } = getNotificationStyles(note.type);
                                            const noteId = note.id || note.notification_id || 0;
                                            const targetPath = getNotificationTargetPath(role, note);
                                            return (
                                                <div
                                                    key={noteId}
                                                    onClick={() => {
                                                        if (!note.is_read) handleMarkRead(noteId);
                                                        if (targetPath) {
                                                            setShowDropdown(false);
                                                            navigate(targetPath);
                                                        }
                                                    }}
                                                    className={`group px-5 py-3.5 flex gap-3 transition-colors ${
                                                        targetPath ? 'cursor-pointer' : 'cursor-default'
                                                    } ${
                                                        !note.is_read
                                                            ? 'bg-purple-50/60 hover:bg-purple-50'
                                                            : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {/* Icon */}
                                                    <div className={`w-9 h-9 rounded-full ${iconBg} ${iconColor} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                                                        <Icon size={15} strokeWidth={2.5} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[13px] leading-snug ${
                                                            !note.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                                                        }`}>
                                                            {note.title}
                                                        </p>
                                                        {note.detail && (
                                                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{note.detail}</p>
                                                        )}
                                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                            <span className="text-[10px] text-gray-400 font-medium">{timeAgo(note.created_at)}</span>
                                                            {note.from_name && (
                                                                <>
                                                                    <span className="text-gray-300 text-[10px]">·</span>
                                                                    <span className="text-[10px] text-gray-400">from <span className="font-semibold text-gray-500">{note.from_name}</span></span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Unread indicator */}
                                                    {!note.is_read && (
                                                        <div className={`w-2 h-2 rounded-full ${dot} shrink-0 mt-2`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    navigate(notificationsPath);
                                }}
                                className="w-full text-center text-[11px] font-bold text-purple-600 hover:text-purple-800 uppercase tracking-wider transition-colors py-0.5"
                            >
                                View All Notifications →
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes notifPopIn {
                    0% { opacity: 0; transform: translateY(6px) scale(0.97); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
