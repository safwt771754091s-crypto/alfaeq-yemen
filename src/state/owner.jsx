import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loadKey, saveKey, hashPin, randomSalt } from '../lib/storage.js';

const OwnerContext = createContext(null);

const OWNER_KEY = 'owner';
const SESSION_KEY = 'smart_teacher_v1:owner_unlocked';

const DEFAULT_OWNER = {
  configured: false,
  name: '',
  email: '',
  phone: '',
  role: 'مالك المنصة',
  salt: '',
  pinHash: '',
  createdAt: ''
};

function readSession() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}

export function OwnerProvider({ children }) {
  const [owner, setOwner] = useState(() => loadKey(OWNER_KEY, DEFAULT_OWNER));
  const [unlocked, setUnlocked] = useState(readSession);

  useEffect(() => { saveKey(OWNER_KEY, owner); }, [owner]);

  const setSession = useCallback((v) => {
    try { v ? sessionStorage.setItem(SESSION_KEY, '1') : sessionStorage.removeItem(SESSION_KEY); } catch { /* تجاهل */ }
    setUnlocked(v);
  }, []);

  const verifyPin = useCallback((pin) => {
    if (!owner.configured) return true;
    return hashPin(String(pin), owner.salt) === owner.pinHash;
  }, [owner]);

  const configureOwner = useCallback((data, pin) => {
    const salt = randomSalt();
    setOwner({
      configured: true,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      role: data.role || 'مالك المنصة',
      salt,
      pinHash: hashPin(String(pin), salt),
      createdAt: new Date().toISOString()
    });
    setSession(true);
  }, [setSession]);

  const login = useCallback((pin) => {
    if (!verifyPin(pin)) return false;
    setSession(true);
    return true;
  }, [verifyPin, setSession]);

  const logout = useCallback(() => setSession(false), [setSession]);

  const updateOwner = useCallback((patch) => {
    setOwner((o) => ({ ...o, ...patch }));
  }, []);

  const changePin = useCallback((oldPin, newPin) => {
    if (!verifyPin(oldPin)) return false;
    const salt = randomSalt();
    setOwner((o) => ({ ...o, salt, pinHash: hashPin(String(newPin), salt) }));
    return true;
  }, [verifyPin]);

  const resetOwner = useCallback(() => {
    setOwner(DEFAULT_OWNER);
    setSession(false);
  }, [setSession]);

  const value = { owner, unlocked, configureOwner, verifyPin, login, logout, updateOwner, changePin, resetOwner };
  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>;
}

export function useOwner() {
  const ctx = useContext(OwnerContext);
  if (!ctx) throw new Error('useOwner must be used within OwnerProvider');
  return ctx;
}
