import { Copy, ExternalLink, Bell, Send, CalendarDays } from 'lucide-react'

export default function ClientDelivery() {
    return (
        <div>
            <div className="mb-5">
                <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Client Delivery</h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>Send final output to the client</p>
            </div>

            {/* Delivery Summary */}
            <div className="crm-card p-5 mb-5">
                <p className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Delivery Summary</p>
                <div className="flex items-center gap-8">
                    {[
                        { label: 'Client', value: 'Priya Sharma', icon: '👤', bg: '#FFF3E0' },
                        { label: 'Project', value: 'Wedding Photography', icon: '📷', bg: '#EDE9FE' },
                        { label: 'Status', value: 'Ready for Delivery', icon: '✓', bg: '#DCFCE7', valueColor: '#16A34A' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>{item.icon}</div>
                            <div>
                                <div className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</div>
                                <div className="text-sm font-semibold" style={{ color: item.valueColor || '#111827' }}>{item.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Final File Links */}
                <div className="crm-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ExternalLink size={14} style={{ color: '#6B7280' }} />
                        <span className="text-sm font-semibold" style={{ color: '#111827' }}>Final File Links</span>
                    </div>
                    {[{ label: 'Photos Download Link', url: 'https://drive.google.com/folder/abc12' },
                    { label: 'Videos Download Link', url: 'https://drive.google.com/folder/abc12' }].map(link => (
                        <div key={link.label} className="mb-4">
                            <p className="text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{link.label}</p>
                            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ border: '1px solid #E5E7EB' }}>
                                <span className="text-sm flex-1 truncate" style={{ color: '#6B7280' }}>{link.url}</span>
                                <button style={{ color: '#9CA3AF' }}><Copy size={14} /></button>
                                <button style={{ color: '#9CA3AF' }}><ExternalLink size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cloud Storage Access */}
                <div className="crm-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <span>☁️</span>
                        <span className="text-sm font-semibold" style={{ color: '#111827' }}>Cloud Storage Access</span>
                    </div>
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#374151' }}>
                            <span>Storage Used</span><span>12.5 GB/50 GB</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: '#F3F4F6' }}>
                            <div className="h-2 rounded-full" style={{ width: '25%', background: '#5B5FC7' }} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Client Portal Access</p>
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ border: '1px solid #E5E7EB' }}>
                            <span className="text-sm flex-1 truncate" style={{ color: '#6B7280' }}>https://portal.photostudio.com/client/sharma</span>
                            <button style={{ color: '#9CA3AF' }}><Copy size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery Details */}
            <div className="crm-card p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays size={14} style={{ color: '#6B7280' }} />
                    <span className="text-sm font-semibold" style={{ color: '#111827' }}>Delivery Details</span>
                </div>
                <div className="grid grid-cols-3 gap-5">
                    {[
                        { label: 'Delivery Date', placeholder: 'dd-mm-yyyy', icon: true },
                        { label: 'Text Files', value: '245 photos, 3 Videos' },
                        { label: 'Total Size', value: '12.5 GB' },
                    ].map(item => (
                        <div key={item.label}>
                            <p className="text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{item.label}</p>
                            <div className="flex items-center justify-between rounded-lg px-3 py-2.5"
                                style={{ border: '1px solid #E5E7EB' }}>
                                <span className="text-sm" style={{ color: item.value ? '#111827' : '#9CA3AF' }}>
                                    {item.value || item.placeholder}
                                </span>
                                {item.icon && <CalendarDays size={14} style={{ color: '#9CA3AF' }} />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button className="crm-card px-5 py-2.5 text-sm font-medium" style={{ color: '#374151' }}>Cancel</button>
                <button className="crm-card flex items-center gap-2 px-5 py-2.5 text-sm font-medium" style={{ color: '#374151' }}>
                    <Bell size={13} /> Notify Chat
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium text-white"
                    style={{ background: '#5B5FC7' }}>
                    <Send size={13} /> Send to Client
                </button>
            </div>
        </div>
    )
}
