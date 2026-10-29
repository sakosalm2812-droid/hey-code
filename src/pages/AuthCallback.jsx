import { useEffect } from 'react'
import { useAuth } from '../AuthContext.jsx'

export default function AuthCallback() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      window.location.href = '/'
    }
  }, [user])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Completing sign in...</div>
      </div>
    </div>
  )
}