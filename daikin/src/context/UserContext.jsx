// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { getUserAttributes } from '../services/userService'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser]       = useState(null)   // full userData object
  const [loginId, setLoginId] = useState('')      // Loginid header value
  const [loginType, setLoginType] = useState('') // Logintype header value
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getUserAttributes()
      .then(response => {
        const userData = response.data

        // login_name and type are arrays in the response shape
        const id   = userData.login_name?.[0] || ''
        const type = userData.type?.[0]        || ''

        // Derive Logintype: SAP expects 'E' for employee, 'P' for partner/external
        // Adjust this mapping to match your SAP backend's expected values
        const sapLoginType = type === 'employee' ? 'E' : 'P'

        setUser(userData)
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
    <UserContext.Provider value={{ user, loginId, loginType, loading, error }}>
      {children}
    </UserContext.Provider>
  )
}

/** Hook — throws if used outside <UserProvider> */
export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}