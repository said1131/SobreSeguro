import { user as defaultUser } from './mockData'

export type AppUser = typeof defaultUser

const registeredUserKey = 'sobreseguro-registered-user'
const currentUserKey = 'sobreseguro-current-user'
const legacyUserKey = 'sobreseguro-user'

function readUser(key: string): AppUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedUser = window.localStorage.getItem(key)

  if (!storedUser) {
    return null
  }

  try {
    return { ...defaultUser, ...JSON.parse(storedUser) }
  } catch {
    return null
  }
}

function writeUser(key: string, user: AppUser) {
  window.localStorage.setItem(key, JSON.stringify(user))
}

function getNameFromEmail(email: string) {
  const emailName = email.split('@')[0]?.trim()
  return emailName ? emailName : defaultUser.firstName
}

export function getStoredUser(): AppUser {
  return readUser(currentUserKey) ?? readUser(legacyUserKey) ?? defaultUser
}

export function saveStoredUser(user: AppUser) {
  writeUser(registeredUserKey, user)
  writeUser(currentUserKey, user)
  window.localStorage.removeItem(legacyUserKey)
}

export function signInUser(email: string, password: string) {
  const registeredUser = readUser(registeredUserKey) ?? readUser(legacyUserKey)
  const normalizedEmail = email.trim()

  if (registeredUser?.email.toLowerCase() === normalizedEmail.toLowerCase()) {
    writeUser(currentUserKey, registeredUser)
    return
  }

  writeUser(currentUserKey, {
    firstName: getNameFromEmail(normalizedEmail),
    lastName: 'Chi Rodriguez',
    email: normalizedEmail || defaultUser.email,
    password: password || defaultUser.password,
  })
}

export function signOutUser() {
  if (typeof window === 'undefined') {
    return
  }
  // Remover todas las claves de autenticación
  window.localStorage.removeItem(registeredUserKey)
  window.localStorage.removeItem(currentUserKey)
  window.localStorage.removeItem(legacyUserKey)
  window.localStorage.removeItem('storedUser')
}
