
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import api from "../services/api";

// ========================================
// CREATE AUTH CONTEXT
// ========================================

const AuthContext = createContext(null);

// ========================================
// AUTH PROVIDER
// ========================================

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ========================================
    // CHECK EXISTING LOGIN SESSION
    // ========================================

    const checkAuth = useCallback(async () => {
        try {
            const response = await api.get("/auth/me");

            const authenticatedUser =
                response.data?.user || null;

            setUser(authenticatedUser);

            return authenticatedUser;
        } catch (error) {
            // 401 is expected when the visitor is not logged in.
            if (error.response?.status !== 401) {
                console.error("Authentication check failed:", error);
            }

            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Check authentication when the application starts
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // ========================================
    // REGISTER CUSTOMER
    // ========================================

    const register = useCallback(async ({ name, email, password }) => {
        const response = await api.post("/auth/register", {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password
        });

        // Registration may return the user immediately.
        // Otherwise, check the session using the auth cookie.
        let authenticatedUser = response.data?.user;

        if (!authenticatedUser) {
            authenticatedUser = await checkAuth();
        }

        if (!authenticatedUser) {
            throw new Error(
                "Registration succeeded, but no active login session was found. Please sign in."
            );
        }

        setUser(authenticatedUser);

        return {
            user: authenticatedUser
        };
    }, [checkAuth]);

    // ========================================
    // LOGIN
    // ========================================

    const login = useCallback(async ({ email, password }) => {
        const response = await api.post("/auth/login", {
            email: email.trim().toLowerCase(),
            password
        });

        let authenticatedUser = response.data?.user;

        if (!authenticatedUser) {
            authenticatedUser = await checkAuth();
        }

        if (!authenticatedUser) {
            throw new Error(
                "Login succeeded, but the session could not be verified."
            );
        }

        setUser(authenticatedUser);

        return {
            user: authenticatedUser
        };
    }, [checkAuth]);

    // ========================================
    // LOGOUT
    // ========================================

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            // Clear local authentication state even if
            // the logout request fails.
            setUser(null);
        }
    }, []);

    // ========================================
    // CONTEXT VALUES
    // ========================================

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            checkAuth,
            isAuthenticated: Boolean(user)
        }),
        [user, loading, login, register, logout, checkAuth]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ========================================
// CUSTOM HOOK
// ========================================

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside an AuthProvider."
        );
    }

    return context;
}
