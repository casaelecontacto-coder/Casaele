export default function Settings() {
  const [msg, setMsg] = React.useState('')
  const [err, setErr] = React.useState('')
  function handleSubmit(e){
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      siteName: form.get('siteName'),
      language: form.get('language'),
      themeColor: form.get('themeColor'),
    }
    if (!payload.siteName) {
      setErr('Site name is required.')
      setMsg('')
      return
    }
    ('Settings saved:', payload)
    setErr('')
    setMsg('Settings saved (demo).')
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {err && <div className="max-w-2xl rounded-xl border border-casa-red/25 bg-casa-red/8 text-casa-red px-4 py-2">{err}</div>}
      {msg && <div className="max-w-2xl rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-2">{msg}</div>}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-sm border border-casa-ink/12 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-casa-ink/75">Site Name</label>
          <input name="siteName" required className="mt-1 w-full rounded-xl border-casa-ink/20 focus:border-casa-red focus:ring-casa-red" placeholder="Casa De ELE" />
        </div>
        <div>
          <label className="block text-sm font-medium text-casa-ink/75">Language</label>
          <select name="language" className="mt-1 w-full rounded-xl border-casa-ink/20 focus:border-casa-red focus:ring-casa-red">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-casa-ink/75">Theme Color</label>
          <input name="themeColor" type="color" className="mt-1 w-20 h-10 p-1 rounded border border-casa-ink/20" defaultValue="#b91c1c" />
        </div>
        <button type="submit" className="inline-flex items-center px-4 py-2 rounded-xl bg-casa-red text-white hover:bg-casa-redDark transition">Save</button>
      </form>
    </div>
  )
}



