import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

import AppLogo from '../assets/libraai.png'
import { BACKEND_API_URL } from '@/lib/constants'

interface AuthAppDataResponse {
    token?: string
    base_url?: string | null
    error?: string
    message?: string
}

const AuthCallbackPage: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'redirecting' | 'error' | 'success'>('loading')
    const [message, setMessage] = useState<string>('Verifying login...')

    useEffect(() => {
        let isMounted = true

        const fetchAppDataAndRedirect = async () => {
            try {
                const { data } = await axios.get<AuthAppDataResponse>(
                    `${BACKEND_API_URL}/auth/callback`,
                    { withCredentials: true }
                )

                if (!isMounted) return

                if (data.error) {
                    setMessage(data.message || data.error || 'Authentication failed.')
                    setStatus('error')
                    return
                }

                if (data.token) {
                    const encodedToken = encodeURIComponent(data.token)
                    const encodeBaseUrl = data.base_url ? encodeURIComponent(data.base_url) : ''
                    const deepLinkUrl = `libra-launch://auth?token=${encodedToken}${
                        data.base_url ? `&base_url=${encodeBaseUrl}` : ''
                    }`

                    setStatus('redirecting')
                    setMessage('Redirecting to LibraLaunch desktop app...')
                    window.location.href = deepLinkUrl

                    setTimeout(() => {
                        if (isMounted) {
                            setStatus('success')
                            setMessage("If the app didn't open, ensure it's installed & running.")
                        }
                    }, 2500)
                } else {
                    setMessage('Authentication failed: Missing token.')
                    setStatus('error')
                }
            } catch (error: unknown) {
                if (!isMounted) return

                let errorMsg = 'Could not connect to finalize login.'
                if (axios.isAxiosError(error) && error.response) {
                    errorMsg =
                        error.response.data?.message || error.response.data?.error || errorMsg
                } else if (error instanceof Error) {
                    errorMsg = error.message
                }

                setMessage(`Error: ${errorMsg}`)
                setStatus('error')
            }
        }

        const timerId = setTimeout(fetchAppDataAndRedirect, 300)

        return () => {
            isMounted = false
            clearTimeout(timerId)
        }
    }, [])

    const renderStatusIcon = () => {
        switch (status) {
            case 'loading':
            case 'redirecting':
                return (
                    <div className="w-16 h-16 flex items-center justify-center text-indigo-600">
                        <Loader2 size={48} className="animate-spin" />
                    </div>
                )
            case 'success':
                return (
                    <div className="w-16 h-16  rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle size={36} strokeWidth={2.5} />
                    </div>
                )
            case 'error':
                return (
                    <div className="w-16 h-16  rounded-full flex items-center justify-center text-red-600 ">
                        <XCircle size={36} strokeWidth={2.5} />
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 text-gray-700 p-6">
            <div className="p-8 sm:p-10 md:p-12 rounded-xl max-w-lg w-full text-center  border-gray-200">
                <div className="flex justify-center mb-6">
                    <img
                        src={AppLogo}
                        alt="LibraLaunch Logo"
                        className="w-16 h-16 object-contain"
                    />
                </div>

                <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-900 tracking-tight">
                    Connecting to Desktop App
                </h1>

                <div
                    className={`py-6 px-4 rounded-lg mb-6 border ${
                        status === 'error'
                            ? 'bg-red-50 border-red-200'
                            : status === 'success'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-indigo-50 border-indigo-200'
                    }`}
                >
                    <div className="flex justify-center mb-5">{renderStatusIcon()}</div>
                    <p
                        className={`text-base font-medium ${
                            status === 'error'
                                ? 'text-red-700'
                                : status === 'success'
                                  ? 'text-green-700'
                                  : 'text-indigo-700'
                        }`}
                    >
                        {message}
                    </p>
                </div>

                {(status === 'success' || status === 'error') && (
                    <div className="mt-8 space-y-4">
                        <p className="text-sm text-gray-600">You can now close this browser tab.</p>
                        {status === 'error' && (
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Try Again
                            </button>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="text-xs text-gray-400 mt-10 border-t border-gray-200 pt-4">
                    © {new Date().getFullYear()} LibraLaunch
                </div>
            </div>
        </div>
    )
}

export default AuthCallbackPage
