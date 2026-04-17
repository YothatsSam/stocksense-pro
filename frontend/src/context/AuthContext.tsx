import { createContext, useContext, useState } from 'react'

export type BusinessType = 'retail' | 'restaurant' | 'distribution'

interface AuthContextValue {
  token: string | null
  userEmail: string | null
  userName: string | null
  organisationId: number | null
  businessType: BusinessType | null
  organisationName: string | null
  signIn: (data: SignInData) => void
  signOut: () => void
  updateProfile: (name: string, email: string) => void
  updateOrgName: (name: string) => void
}

export interface SignInData {
  token: string
  email: string
  name?: string | null
  organisationId: number
  businessType: BusinessType
  organisationName: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readJson<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]               = useState<string | null>(() => localStorage.getItem('token'))
  const [userEmail, setUserEmail]       = useState<string | null>(() => localStorage.getItem('userEmail'))
  const [userName, setUserName]         = useState<string | null>(() => localStorage.getItem('userName'))
  const [organisationId, setOrgId]      = useState<number | null>(() => readJson<number>('organisationId'))
  const [businessType, setBizType]      = useState<BusinessType | null>(() => readJson<BusinessType>('businessType'))
  const [organisationName, setOrgName]  = useState<string | null>(() => localStorage.getItem('organisationName'))

  function signIn(data: SignInData) {
    localStorage.setItem('token',            data.token)
    localStorage.setItem('userEmail',        data.email)
    localStorage.setItem('userName',         data.name ?? '')
    localStorage.setItem('organisationId',   JSON.stringify(data.organisationId))
    localStorage.setItem('businessType',     JSON.stringify(data.businessType))
    localStorage.setItem('organisationName', data.organisationName)

    setToken(data.token)
    setUserEmail(data.email)
    setUserName(data.name ?? null)
    setOrgId(data.organisationId)
    setBizType(data.businessType)
    setOrgName(data.organisationName)
  }

  function signOut() {
    ['token', 'userEmail', 'userName', 'organisationId', 'businessType', 'organisationName']
      .forEach(k => localStorage.removeItem(k))
    setToken(null)
    setUserEmail(null)
    setUserName(null)
    setOrgId(null)
    setBizType(null)
    setOrgName(null)
  }

  function updateProfile(name: string, email: string) {
    localStorage.setItem('userName', name)
    localStorage.setItem('userEmail', email)
    setUserName(name || null)
    setUserEmail(email)
  }

  function updateOrgName(name: string) {
    localStorage.setItem('organisationName', name)
    setOrgName(name)
  }

  return (
    <AuthContext.Provider value={{ token, userEmail, userName, organisationId, businessType, organisationName, signIn, signOut, updateProfile, updateOrgName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
