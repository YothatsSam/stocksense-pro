import { createContext, useContext, useState } from 'react'

interface AuthContextValue {
  token: string | null
  userEmail: string | null
  signIn: (token: string, email: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('userEmail'))

  function signIn(newToken: string, email: string) {
    localStorage.setItem('token', newToken)
    localStorage.setItem('userEmail', email)
    setToken(newToken)
    setUserEmail(email)
  }

  function signOut() {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    setToken(null)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider value={{ token, userEmail, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
