import { useState, useRef } from 'react'
import { Paperclip, X, Plus } from 'lucide-react'
import { sendEmailAPI } from '../api/email.api'

interface Props {
    onBack: () => void
    client: { name: string; email: string }
}

interface Attachment {
    name: string
    size: string
    file?: File
}

const avatarColors = ['#3B82F6', '#F97316', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B']
function getColor(email: string) {
    let hash = 0
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
    return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default function EmailCompose({ onBack, client }: Props) {
    const [recipients, setRecipients] = useState<string[]>(client.email ? [client.email] : [])
    const [newRecipient, setNewRecipient] = useState('')
    const [cc, setCc] = useState('')
    const [bcc, setBcc] = useState('')
    const [showCc, setShowCc] = useState(false)
    const [showBcc, setShowBcc] = useState(false)
    const [subject, setSubject] = useState('Concept of onboarding flow')
    const [body, setBody] = useState(
        `Hey @${client.name.split(' ')[0].toLowerCase()},\n\nI've been digging into our onboarding flow and wanted to share a proposal for a new direction. Right now, the experience asks a lot from users before showing them any real value, which might be contributing to early drop-offs.\n\nI've put together a revised flow that simplifies the first steps, guides users more clearly, and helps them reach their first 'aha' moment faster. The goal is to improve activation, reduce friction, and better align with what we're seeing in analytics and user feedback.\n\nIf you're up for it, I'd love to walk you through the idea and get your thoughts. Let me know a good time.\n\nBest,\nRobin`
    )
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const addRecipient = () => {
        const email = newRecipient.trim()
        if (email && email.includes('@') && !recipients.includes(email)) {
            setRecipients([...recipients, email])
            setNewRecipient('')
        }
    }

    const removeRecipient = (email: string) => {
        setRecipients(recipients.filter(r => r !== email))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); addRecipient() }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        const newAttachments: Attachment[] = Array.from(files).map(f => ({
            name: f.name.replace(/\.[^/.]+$/, ''),
            size: f.size < 1024 ? `${f.size} B` : f.size < 1048576 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / 1048576).toFixed(1)} MB`,
            file: f
        }))
        setAttachments([...attachments, ...newAttachments])
        e.target.value = ''
    }

    const removeAttachment = (name: string) => {
        setAttachments(attachments.filter(a => a.name !== name))
    }

    const handleSend = async () => {
        if (recipients.length === 0 || !subject.trim() || !body.trim()) return
        setSending(true)
        
        try {
            const formData = new FormData()
            formData.append('to', JSON.stringify(recipients))
            if (cc) formData.append('cc', cc)
            if (bcc) formData.append('bcc', bcc)
            formData.append('subject', subject)
            formData.append('body', body)
            
            attachments.forEach(att => {
                if (att.file) {
                    formData.append('attachments', att.file)
                }
            })
            
            await sendEmailAPI(formData)
            
            setSending(false)
            setSent(true)
            setTimeout(() => {
                setSent(false)
                onBack()
            }, 1500)
        } catch (error) {
            console.error('Failed to send email:', error)
            setSending(false)
            alert('Failed to send email. Please try again.')
        }
    }

    return (
        <div>
            <div className="mb-5">
                <button onClick={onBack} className="flex items-center gap-1 text-sm mb-3" style={{ color: '#5B5FC7' }}>
                    ← Schedule Meeting
                </button>
            </div>

            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB', maxWidth: '700px', margin: '0 auto' }}>
                <p className="text-xs font-semibold mb-4" style={{ color: '#374151' }}>New email</p>

                {/* To field */}
                <div className="flex items-center gap-2 mb-1 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <span className="text-xs" style={{ color: '#9CA3AF', minWidth: '18px' }}>To</span>
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                        {recipients.map(email => (
                            <div key={email} className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: '#F3F4F6' }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: getColor(email) }}>
                                    <span className="text-white text-xs">{email[0]}</span>
                                </div>
                                <span className="text-xs" style={{ color: '#374151' }}>{email}</span>
                                <button onClick={() => removeRecipient(email)} className="ml-0.5" style={{ color: '#9CA3AF' }}>
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <input
                            type="email"
                            value={newRecipient}
                            onChange={e => setNewRecipient(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={addRecipient}
                            placeholder="Add recipient..."
                            className="bg-transparent outline-none text-xs flex-1"
                            style={{ color: '#374151', minWidth: '120px' }}
                        />
                    </div>
                    <div className="flex gap-2 text-xs cursor-pointer" style={{ color: '#9CA3AF' }}>
                        <span onClick={() => setShowCc(!showCc)}>Cc</span>
                        <span onClick={() => setShowBcc(!showBcc)}>Bcc</span>
                    </div>
                </div>

                {/* Cc field */}
                {showCc && (
                    <div className="flex items-center gap-2 mb-1 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <span className="text-xs" style={{ color: '#9CA3AF', minWidth: '18px' }}>Cc</span>
                        <input
                            type="email"
                            value={cc}
                            onChange={e => setCc(e.target.value)}
                            placeholder="Add Cc recipients..."
                            className="bg-transparent outline-none text-xs flex-1"
                            style={{ color: '#374151' }}
                        />
                    </div>
                )}

                {/* Bcc field */}
                {showBcc && (
                    <div className="flex items-center gap-2 mb-1 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <span className="text-xs" style={{ color: '#9CA3AF', minWidth: '18px' }}>Bcc</span>
                        <input
                            type="email"
                            value={bcc}
                            onChange={e => setBcc(e.target.value)}
                            placeholder="Add Bcc recipients..."
                            className="bg-transparent outline-none text-xs flex-1"
                            style={{ color: '#374151' }}
                        />
                    </div>
                )}

                {/* Subject */}
                <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full font-semibold mb-4 mt-3 outline-none"
                    style={{ color: '#111827', fontSize: '15px' }}
                    placeholder="Subject"
                />

                {/* Body */}
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full text-sm mb-5 outline-none resize-none"
                    style={{ color: '#374151', lineHeight: '1.7', minHeight: '240px' }}
                    placeholder="Write your email..."
                />

                {/* Attachments */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ color: '#5B5FC7', background: '#F0EFFE' }}
                    >
                        <Plus size={13} /> Add file
                    </button>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                </div>
                {attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {attachments.map(a => (
                            <div key={a.name} className="flex items-center gap-3 rounded-xl p-3" style={{ border: '1px solid #E5E7EB' }}>
                                <Paperclip size={16} style={{ color: '#9CA3AF' }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate" style={{ color: '#374151' }}>{a.name}</div>
                                    <div className="text-xs" style={{ color: '#9CA3AF' }}>{a.size}</div>
                                </div>
                                <button onClick={() => removeAttachment(a.name)} style={{ color: '#9CA3AF' }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onBack}
                        className="px-5 py-2 rounded-xl text-sm font-medium border"
                        style={{ borderColor: '#E5E7EB', color: '#374151' }}
                    >
                        Review
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || recipients.length === 0}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
                        style={{
                            background: sending ? '#8B8FCF' : '#5B5FC7',
                            opacity: recipients.length === 0 ? 0.5 : 1,
                            cursor: recipients.length === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {sending ? 'Sending...' : 'Send →'}
                    </button>
                </div>
            </div>

            {/* Sent Toast */}
            {sent && (
                <div className="fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white shadow-lg"
                    style={{ border: '1px solid #E5E7EB', zIndex: 100 }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                        <span style={{ color: '#16A34A', fontSize: '12px' }}>✓</span>
                    </div>
                    <div>
                        <div className="text-sm font-semibold" style={{ color: '#111827' }}>Email Sent</div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>Email delivered to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}.</div>
                    </div>
                </div>
            )}
        </div>
    )
}
