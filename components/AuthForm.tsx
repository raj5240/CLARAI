import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    Loader2,
    Lock,
    Mail,
    LogIn,
    UserPlus,
    Unlock,
    ShieldCheck,
    ArrowLeft,
} from "lucide-react";

type AuthMode = "signin" | "signup" | "forgot" | "reset";

interface AuthFormProps {
    mode: AuthMode;
    onModeChange: (next: AuthMode) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange }) => {
    const {
        signIn,
        signUp,
        requestPasswordReset,
        verifyPasswordReset,
        error,
        clearError,
    } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otpInput, setOtpInput] = useState("");
    const [resetEmail, setResetEmail] = useState<string | null>(null);
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        clearError();
        setPassword("");
        setConfirmPassword("");
        setOtpInput("");
        if (mode === "signin" || mode === "signup") {
            setGeneratedOtp(null);
            setResetEmail(null);
        }
    }, [mode, clearError]);

    const handleAuthSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (mode === "signup" && password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            if (mode === "signin") {
                await signIn(email, password);
            } else if (mode === "signup") {
                await signUp(email, password);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        try {
            const otp = await requestPasswordReset(email);
            setGeneratedOtp(otp);
            setResetEmail(email.toLowerCase());
            onModeChange("reset");
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!resetEmail) {
            alert("No reset request found. Please request a new code.");
            onModeChange("forgot");
            return;
        }
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await verifyPasswordReset(resetEmail, otpInput, password);
        } finally {
            setLoading(false);
        }
    };

    const renderHeading = () => {
        switch (mode) {
            case "signin":
                return "Welcome back";
            case "signup":
                return "Create your account";
            case "forgot":
                return "Forgot password?";
            case "reset":
                return "Verify your OTP";
            default:
                return "";
        }
    };

    const renderDescription = () => {
        switch (mode) {
            case "signin":
                return "Sign in to access your saved chats and AI modules.";
            case "signup":
                return "Join to unlock chat history and personalized AI experiences.";
            case "forgot":
                return "Enter the email you used to create your account. We'll generate a one-time code.";
            case "reset":
                return resetEmail
                    ? `We generated a one-time code for ${resetEmail}. Enter it below along with your new password.`
                    : "Enter the OTP sent to your email along with your new password.";
            default:
                return "";
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 text-white shadow-2xl">
            {(mode === "forgot" || mode === "reset") && (
                <button
                    type="button"
                    onClick={() => onModeChange("signin")}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </button>
            )}

            <h1 className="text-2xl font-semibold mb-2 text-center">{renderHeading()}</h1>
            <p className="text-sm text-gray-400 text-center mb-6">{renderDescription()}</p>

            {mode === "signin" || mode === "signup" ? (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">
                        Email
                        <div className="mt-1 relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                            />
                        </div>
                    </label>

                    <label className="block text-sm font-medium text-gray-300">
                        Password
                        <div className="mt-1 relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                            />
                        </div>
                    </label>

                    {mode === "signup" && (
                        <label className="block text-sm font-medium text-gray-300">
                            Confirm password
                            <div className="mt-1 relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                                />
                            </div>
                        </label>
                    )}

                    {error && (
                        <div className="text-sm text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-2.5 text-sm font-medium transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : mode === "signin" ? (
                            <>
                                <LogIn className="w-4 h-4" />
                                Sign in
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                Create account
                            </>
                        )}
                    </button>

                    {mode === "signin" && (
                        <div className="text-sm text-center text-gray-400">
                            <button
                                type="button"
                                onClick={() => onModeChange("forgot")}
                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}
                </form>
            ) : null}

            {mode === "forgot" && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">
                        Account email
                        <div className="mt-1 relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                            />
                        </div>
                    </label>

                    {error && (
                        <div className="text-sm text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-2.5 text-sm font-medium transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating code...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                Send verification code
                            </>
                        )}
                    </button>
                </form>
            )}

            {mode === "reset" && (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                    {generatedOtp && (
                        <div className="text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-lg px-3 py-2">
                            Demo OTP (valid 10 minutes): <span className="font-semibold">{generatedOtp}</span>
                        </div>
                    )}

                    <label className="block text-sm font-medium text-gray-300">
                        Email
                        <div className="mt-1 relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                value={resetEmail ?? email}
                                onChange={(e) => setResetEmail(e.target.value.toLowerCase())}
                                required
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                            />
                        </div>
                    </label>

                    <label className="block text-sm font-medium text-gray-300">
                        One-time code
                        <div className="mt-1 relative">
                            <Unlock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.trim())}
                                required
                                maxLength={6}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors tracking-widest uppercase"
                            />
                        </div>
                    </label>

                    <label className="block text-sm font-medium text-gray-300">
                        New password
                        <div className="mt-1 relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                            />
                        </div>
                    </label>

                    <label className="block text-sm font-medium text-gray-300">
                        Confirm new password
                        <div className="mt-1 relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                            />
                        </div>
                    </label>

                    {error && (
                        <div className="text-sm text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-2.5 text-sm font-medium transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                Update password
                            </>
                        )}
                    </button>
                </form>
            )}

            {mode === "signin" || mode === "signup" ? (
                <p className="mt-5 text-sm text-center text-gray-400">
                    {mode === "signin" ? (
                        <>
                            Need an account?{" "}
                            <button
                                type="button"
                                onClick={() => onModeChange("signup")}
                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already registered?{" "}
                            <button
                                type="button"
                                onClick={() => onModeChange("signin")}
                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </p>
            ) : null}
        </div>
    );
};

export default AuthForm;

