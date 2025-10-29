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
    console.log('Settings saved:', payload)
    setErr('')
    setMsg('Settings saved (demo).')
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {err && <div className="max-w-2xl rounded-md border border-red-200 bg-red-50 text-red-700 px-4 py-2">{err}</div>}
      {msg && <div className="max-w-2xl rounded-md border border-green-200 bg-green-50 text-green-700 px-4 py-2">{msg}</div>}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700">Site Name</label>
          <input name="siteName" required className="mt-1 w-full rounded-md border-gray-300 focus:border-red-600 focus:ring-red-600" placeholder="Casa De ELE" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select name="language" className="mt-1 w-full rounded-md border-gray-300 focus:border-red-600 focus:ring-red-600">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Theme Color</label>
          <input name="themeColor" type="color" className="mt-1 w-20 h-10 p-1 rounded border border-gray-300" defaultValue="#b91c1c" />
        </div>
        <button type="submit" className="inline-flex items-center px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 transition">Save</button>
      </form>
    </div>
  )
}



