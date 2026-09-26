import { useState } from 'react'
import { useAuth } from '../../auth/state/authContext'
import { api } from '../../../shared/api/client'

export default function ProfilePage() {
  const { user, token, setSession } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const updatedUser = await api('/profile', { method: 'PATCH', token, body: { name } })
      setSession({ token, user: updatedUser })
      setMessage('Your profile has been updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="page narrow-page">
    <div className="page-heading"><div><p className="eyebrow">Account settings</p><h1>Profile</h1><p>Manage the name shown to your StockSense workspace.</p></div></div>
    <form className="panel profile-card form-stack" onSubmit={submit}>
      <div className="profile-summary"><span className="profile-avatar">{user?.name?.slice(0, 1).toUpperCase()}</span><div><h2>{user?.name}</h2><p>{user?.email}</p><span className="mini-tag">{user?.role === 'manager' ? 'Inventory manager' : 'Warehouse staff'}</span></div></div>
      {error && <div className="notice error">{error}</div>}
      {message && <div className="notice success">{message}</div>}
      <label className="field"><span>Display name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="field"><span>Email address</span><input value={user?.email || ''} disabled /></label>
      <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  </section>
}
