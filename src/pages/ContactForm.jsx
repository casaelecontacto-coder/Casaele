import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e){
    e.preventDefault()
    setSubmitting(true)
    setStatus('')
    try{
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if(!res.ok) throw new Error('Submission failed')
      setForm({ name:'', email:'', message:'' })
      setStatus('Thanks! Your message was sent.')
    }catch(err){
      setStatus('Failed to send. Please try again.')
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">Contact Us</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required className="mt-1 w-full rounded-md border-gray-300 focus:border-red-600 focus:ring-red-600" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required className="mt-1 w-full rounded-md border-gray-300 focus:border-red-600 focus:ring-red-600" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Message</label>
          <textarea rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="mt-1 w-full rounded-md border-gray-300 focus:border-red-600 focus:ring-red-600" />
        </div>
        <button disabled={submitting} className="px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-60">{submitting?'Sending...':'Send'}</button>
      </form>
      {status && <p className="mt-3 text-sm text-gray-700">{status}</p>}
    </div>
  )
}


