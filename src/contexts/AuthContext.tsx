import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../supabase'
import type { TblUsuario, TblParametro } from '../types/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
    user: TblUsuario | null
    supabaseUser: User | null
    company: TblParametro | null
    loading: boolean
    isOtpVerified: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    setCompany: (company: TblParametro) => void
    verifyOtp: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<TblUsuario | null>(null)
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
    const [company, setCompanyState] = useState<TblParametro | null>(null)
    const [loading, setLoading] = useState(true)
    const [isOtpVerified, setIsOtpVerified] = useState(false)

    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSupabaseUser(session.user)
                loadUserData(session.user.email!)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setSupabaseUser(session.user)
                loadUserData(session.user.email!)
            } else {
                setSupabaseUser(null)
                setUser(null)
                setCompanyState(null)
            }
        })

        // Load company from localStorage
        const savedCompany = localStorage.getItem('selectedCompany')
        if (savedCompany) {
            setCompanyState(JSON.parse(savedCompany))
        }

        return () => subscription.unsubscribe()
    }, [])

    async function loadUserData(email: string) {
        try {
            const { data, error } = await supabase
                .from('tbl_usuario')
                .select('*')
                .eq('email', email)
                .eq('status_operacional', 1)
                .single()

            if (error) throw error
            if (!data) throw new Error('Usuário não encontrado ou inativo')

            setUser(data)
        } catch (error) {
            console.error('Error loading user data:', error)
            await supabase.auth.signOut()
        }
    }

    async function login(email: string, password: string) {
        try {
            // First check if user exists and is active
            const { data: userData, error: userError } = await supabase
                .from('tbl_usuario')
                .select('*')
                .eq('email', email)
                .eq('status_operacional', 1)
                .single()

            if (userError || !userData) {
                throw new Error('Usuário não encontrado ou inativo')
            }

            // Authenticate with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (authError) throw authError

            setUser(userData)
            setSupabaseUser(authData.user)

            // Clear company state on new login
            setCompanyState(null)
            localStorage.removeItem('selectedCompany')
        } catch (error: any) {
            console.error('Login error:', error)
            throw error
        }
    }

    async function logout() {
        await supabase.auth.signOut()
        setUser(null)
        setSupabaseUser(null)
        setCompanyState(null)
        setIsOtpVerified(false)
        localStorage.removeItem('selectedCompany')
    }

    function setCompany(company: TblParametro) {
        setCompanyState(company)
        localStorage.setItem('selectedCompany', JSON.stringify(company))
    }

    function verifyOtp() {
        setIsOtpVerified(true)
    }

    return (
        <AuthContext.Provider value={{ user, supabaseUser, company, loading, isOtpVerified, login, logout, setCompany, verifyOtp }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
