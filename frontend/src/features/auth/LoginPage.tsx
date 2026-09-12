import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { loginUser } from './authSlice'
import Spinner from '../../components/common/Spinner'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((s) => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)

  const emailError = touched && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email address.' : null
  const passwordError = touched && password.length < 4 ? 'Password must be at least 4 characters.' : null

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTouched(true)
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 4) return
    dispatch(loginUser({ email, password }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-800 px-4">
      <div className="w-full max-w-md">
      

        <div className="rounded-xl bg-white p-7 shadow-xl">
          <h1 className="text-lg font-semibold text-ink-900">Sign in to your workspace</h1>
          <p className="mt-1 text-sm text-ink-500">Track projects, tasks, and team activity in one place.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-amber-500"
              />
              {emailError && <p className="mt-1 text-xs text-rose-600">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-amber-500"
              />
              {passwordError && <p className="mt-1 text-xs text-rose-600">{passwordError}</p>}
            </div>

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-amber-600 disabled:opacity-60"
            >
              {status === 'loading' && <Spinner size={16} className="text-ink-900" />}
              Sign in
            </button>
          </form>

        
        </div>
      </div>
    </div>
  )
}
// @ts-nocheck
