
import { useEffect, useState } from "react";
import {
    Link,
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        user,
        loading: authLoading,
        login,
        register
    } = useAuth();

    // Determine the form using the current URL
    const isRegister = location.pathname === "/register";

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Clear errors and passwords when switching forms
    useEffect(() => {
        setError("");
        setShowPassword(false);

        setFormData((previous) => ({
            ...previous,
            password: "",
            confirmPassword: ""
        }));
    }, [isRegister]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) return;

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;

        if (isRegister && name.length < 2) {
            setError("Please enter your full name.");
            return;
        }

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        if (isRegister) {
            if (password.length < 8) {
                setError("Password must contain at least 8 characters.");
                return;
            }

            if (password !== formData.confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
        }

        try {
            setSubmitting(true);
            setError("");

            let result;

            if (isRegister) {
                result = await register({
                    name,
                    email,
                    password
                });
            } else {
                result = await login({
                    email,
                    password
                });
            }

            // The auth context may return either a user
            // or a response containing a user.
            const authenticatedUser =
                result?.user || result?.data?.user || result;

            const role = authenticatedUser?.role;

            if (role === "seller") {
                navigate("/seller", { replace: true });
            } else if (role === "admin") {
                navigate("/admin", { replace: true });
            } else if (role === "customer") {
                navigate("/shop", { replace: true });
            } else {
                // AuthContext may update the user asynchronously.
                navigate("/account", { replace: true });
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Authentication failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Wait for AuthContext to check existing login
    if (authLoading) {
        return (
            <main className="flex min-h-[75vh] items-center justify-center bg-[#faf9f6] px-5">
                <p className="text-sm text-neutral-500">
                    Loading...
                </p>
            </main>
        );
    }

    // Already logged-in users don't need the auth form
    if (user) {
        const destination =
            user.role === "seller"
                ? "/seller"
                : user.role === "admin"
                    ? "/admin"
                    : "/shop";

        return <Navigate to={destination} replace />;
    }

    return (
        <main className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[#faf9f6] px-5 py-16 text-[#191919]">
            <div className="w-full max-w-md border border-neutral-200 bg-white px-8 py-11 shadow-sm sm:px-10">

                {/* Brand */}
                <div className="mb-9 text-center">
                    <Link
                        to="/"
                        className="inline-block text-4xl tracking-[0.25em]"
                    >
                        VESTRA
                    </Link>

                    <h1 className="mt-8 text-3xl">
                        {isRegister ? "Create Account" : "Welcome Back"}
                    </h1>

                    <p className="mt-3 text-sm text-neutral-500">
                        {isRegister
                            ? "Join VESTRA and discover your personal style."
                            : "Sign in to your account"}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div
                        role="alert"
                        className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {/* Authentication form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Name: Registration only */}
                    {isRegister && (
                        <div>
                            <label
                                htmlFor="auth-name"
                                className="mb-2 block text-sm"
                            >
                                Full Name
                            </label>

                            <input
                                id="auth-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                autoComplete="name"
                                required
                                minLength={2}
                                className="w-full rounded-none border border-neutral-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="auth-email"
                            className="mb-2 block text-sm"
                        >
                            Email Address
                        </label>

                        <input
                            id="auth-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                            className="w-full rounded-none border border-neutral-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="auth-password"
                            className="mb-2 block text-sm"
                        >
                            Password
                        </label>

                        <div className="relative">
                            <input
                                id="auth-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete={
                                    isRegister
                                        ? "new-password"
                                        : "current-password"
                                }
                                required
                                minLength={isRegister ? 8 : undefined}
                                className="w-full rounded-none border border-neutral-300 bg-white px-4 py-4 pr-20 text-sm outline-none transition focus:border-black"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={
                                    showPassword ? "Hide password" : "Show password"
                                }
                                className="absolute inset-y-0 right-3 cursor-pointer px-2 text-xs text-neutral-500 hover:text-black"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Confirm password: Registration only */}
                    {isRegister && (
                        <div>
                            <label
                                htmlFor="auth-confirm-password"
                                className="mb-2 block text-sm"
                            >
                                Confirm Password
                            </label>

                            <input
                                id="auth-confirm-password"
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                required
                                className="w-full rounded-none border border-neutral-300 bg-white px-4 py-4 text-sm outline-none transition focus:border-black"
                            />
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 w-full cursor-pointer bg-[#242120] px-6 py-4 text-sm text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting
                            ? isRegister
                                ? "Creating Account..."
                                : "Signing In..."
                            : isRegister
                                ? "Create Account"
                                : "Sign In"}
                    </button>
                </form>

                {/* Switch between login and registration */}
                <div className="mt-8 text-center text-sm text-neutral-600">
                    {isRegister ? (
                        <p>
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="border-b border-black text-black transition hover:text-neutral-500"
                            >
                                Sign In
                            </Link>
                        </p>
                    ) : (
                        <p>
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="border-b border-black text-black transition hover:text-neutral-500"
                            >
                                Register
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
