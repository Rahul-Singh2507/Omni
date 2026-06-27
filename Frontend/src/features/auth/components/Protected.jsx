import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'


const Protected = ({ children }) => {
    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-700 animate-spin" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-slate-900">Preparing your workspace</h2>
                            <p className="mt-1 text-sm text-slate-500">Checking your session and loading your dashboard.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }


    return children
}

export default Protected