"use client"
import { useState } from 'react'
import AccountLayout from '@/components/layout/account-layout/AccountLayout'
import { useAuth } from '@/context/AuthContext'
import { useAppSettings } from '@/hooks/useAppSettings'
import { Mail, Phone, MessageSquare, MapPin, Clock, Send, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const { isAuthenticated } = useAuth()
  const { appName } = useAppSettings()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.subject.trim()) e.subject = 'Subject is required'
    if (!form.message.trim() || form.message.length < 20) e.message = 'Message must be at least 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1200))   // fake submit delay
    setSubmitted(true)
    setIsLoading(false)
  }

  const CONTENT = (
    <div className="grid md:grid-cols-3 gap-4">

      {/* LEFT: Contact Info */}
      <div className="space-y-3">
        {[
          {
            icon: Mail,
            title: 'Email Us',
            value: 'support@rvmobile.in',
            sub: 'Reply within 24 hours',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            icon: Phone,
            title: 'Call Us',
            value: '+91 98765 43210',
            sub: 'Mon–Sat, 10am–6pm',
            color: 'text-green-500',
            bg: 'bg-green-500/10',
          },
          {
            icon: MessageSquare,
            title: 'WhatsApp',
            value: '+91 98765 43210',
            sub: 'Quick replies',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            icon: MapPin,
            title: 'Address',
            value: 'Ahmedabad, Gujarat',
            sub: 'India — 380001',
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
          },
          {
            icon: Clock,
            title: 'Business Hours',
            value: 'Mon – Sat',
            sub: '10:00 AM – 6:00 PM',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
          },
        ].map(({ icon: Icon, title, value, sub, color, bg }) => (
          <div key={title} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={17} className={color} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: Contact Form (col-span-2) */}
      <div className="md:col-span-2">
        {submitted ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-black" style={{ fontFamily: 'var(--font-heading)' }}>Message Sent!</h3>
              <p className="text-sm text-muted-foreground mt-1">We'll get back to you within 24 hours.</p>
            </div>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
              className="border border-border px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted transition-all"
            >
              Send Another
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-black text-base" style={{ fontFamily: 'var(--font-heading)' }}>Send us a Message</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  className={`w-full h-11 px-4 bg-background border rounded-xl text-sm outline-none transition-colors ${errors.name ? 'border-destructive' : 'border-border focus:border-primary'}`}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                  className={`w-full h-11 px-4 bg-background border rounded-xl text-sm outline-none transition-colors ${errors.email ? 'border-destructive' : 'border-border focus:border-primary'}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10-digit mobile"
                  className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Subject *</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className={`w-full h-11 px-4 bg-background border rounded-xl text-sm outline-none transition-colors ${errors.subject ? 'border-destructive' : 'border-border focus:border-primary'}`}
                >
                  <option value="">Select subject</option>
                  <option value="order">Order Issue</option>
                  <option value="payment">Payment Problem</option>
                  <option value="return">Return / Refund</option>
                  <option value="product">Product Query</option>
                  <option value="other">Other</option>
                </select>
                {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Message *</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Describe your issue or query in detail..."
                className={`w-full px-4 py-3 bg-background border rounded-xl text-sm outline-none resize-none transition-colors ${errors.message ? 'border-destructive' : 'border-border focus:border-primary'}`}
              />
              <div className="flex justify-between mt-1">
                {errors.message
                  ? <p className="text-xs text-destructive">{errors.message}</p>
                  : <span />
                }
                <p className="text-xs text-muted-foreground">{form.message.length}/500</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
              ) : (
                <><Send size={15} /> Send Message</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // If authenticated → use AccountLayout (sidebar)
  // If not → standalone page
  if (isAuthenticated) {
    return (
      <AccountLayout title="Contact & Support" subtitle="Get help from our team">
        {CONTENT}
      </AccountLayout>
    )
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 md:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>
          Contact & Support
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          We're here to help — reach out anytime
        </p>
      </div>
      {CONTENT}
    </div>
  )
}
