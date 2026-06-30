import React, { createContext, useContext, useEffect, useState } from 'react'
import { getUserAttributes } from '../services/userService'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [role, setRole]           = useState(null)   
  const [loginId, setLoginId]     = useState('')
  const [loginType, setLoginType] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

useEffect(() => {
  setUser(null)
  setLoading(true)
  getUserAttributes()
    .then(response => {
      const userData = response.data

      const email     = userData.email           || ''
      const loginName = userData.login_name?.[0]  || ''
      const type       = userData.type?.[0]       || ''
      const groups     = userData.Groups || []

      const isApprover = groups.includes('Approver')

      const id            = isApprover ? email : loginName
      const sapLoginType  = type === 'employee' ? 'E' : 'P'
      const userRole      = type === 'employee' ? 'employee' : 'partner'

      setUser(userData)
      setRole(userRole)
      setLoginId(id)
      setLoginType(sapLoginType)
    })
    .catch(err => {
      console.error('UserContext: failed to load user attributes', err)
      setError(err.message)
    })
    .finally(() => setLoading(false))
}, [])

  return (
    // ← ADD role to the value
    <UserContext.Provider value={{ user, role, loginId, loginType, loading, error }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}