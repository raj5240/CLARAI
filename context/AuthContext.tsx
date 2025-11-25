import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface StoredAccount {
    email: string;
    passwordHash: string;
    createdAt: string;
}

interface PasswordResetToken {
    email: string;
    otpHash: string;
    expiresAt: string;
}

export interface AuthUser {
    email: string;
    createdAt: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    clearError: () => void;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    requestPasswordReset: (email: string) => Promise<string>;
    verifyPasswordReset: (email: string, otp: string, newPassword: string) => Promise<void>;
    refreshSession: () => Promise<boolean>;
}

const ACCOUNTS_KEY = "clarai.auth.accounts";
const SESSION_KEY = "clarai.auth.session";
const RESET_KEY = "clarai.auth.resetTokens";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

const hashString = async (value: string): Promise<string> => {
    if (typeof crypto !== "undefined" && crypto.subtle && textEncoder) {
        const data = textEncoder.encode(value);
        const hash = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }
    return btoa(value);
};

const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const getAccounts = (): StoredAccount[] => {
    if (typeof window === "undefined") {
        return [];
    }
    try {
        const raw = window.localStorage.getItem(ACCOUNTS_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw) as StoredAccount[];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Failed to parse stored accounts.", error);
        return [];
    }
};

const persistAccounts = (accounts: StoredAccount[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const persistSession = (email: string | null) => {
    if (typeof window === "undefined") return;
    if (!email) {
        window.localStorage.removeItem(SESSION_KEY);
    } else {
        window.localStorage.setItem(SESSION_KEY, email);
    }
};

const getSession = (): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SESSION_KEY);
};

const getResetTokens = (): PasswordResetToken[] => {
    if (typeof window === "undefined") {
        return [];
    }
    try {
        const raw = window.localStorage.getItem(RESET_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw) as PasswordResetToken[];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Failed to parse stored reset tokens.", error);
        return [];
    }
};

const persistResetTokens = (tokens: PasswordResetToken[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(RESET_KEY, JSON.stringify(tokens));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAccountForEmail = (email: string | null): StoredAccount | null => {
        if (!email) return null;
        const accounts = getAccounts();
        return accounts.find((item) => item.email === email.toLowerCase()) ?? null;
    };

    useEffect(() => {
        const initialiseSession = () => {
            const email = getSession();
            const account = loadAccountForEmail(email);
            if (account) {
                setUser({ email: account.email, createdAt: account.createdAt });
            } else {
                persistSession(null);
                setUser(null);
            }
            setLoading(false);
        };

        initialiseSession();
    }, []);

    const runAuthAction = async <T,>(action: () => Promise<T>): Promise<T> => {
        setError(null);
        try {
            return await action();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Authentication failed. Please try again.");
            }
            throw err;
        }
    };

    const value = useMemo<AuthContextValue>(() => {
        return {
            user,
            isAuthenticated: Boolean(user),
            loading,
            error,
            clearError: () => setError(null),
            signIn: (email, password) =>
                runAuthAction(async () => {
                    const accounts = getAccounts();
                    const normalizedEmail = email.toLowerCase();
                    const existing = accounts.find((account) => account.email === normalizedEmail);
                    if (!existing) {
                        throw new Error("Account not found. Please sign up first.");
                    }
                    const hash = await hashString(password);
                    if (existing.passwordHash !== hash) {
                        throw new Error("Incorrect password. Please try again.");
                    }
                    setUser({ email: existing.email, createdAt: existing.createdAt });
                    persistSession(existing.email);
                }),
            signUp: (email, password) =>
                runAuthAction(async () => {
                    const normalizedEmail = email.toLowerCase();
                    const accounts = getAccounts();
                    if (accounts.some((account) => account.email === normalizedEmail)) {
                        throw new Error("An account with this email already exists. Try signing in.");
                    }
                    const passwordHash = await hashString(password);
                    const newAccount: StoredAccount = {
                        email: normalizedEmail,
                        passwordHash,
                        createdAt: new Date().toISOString(),
                    };
                    persistAccounts([...accounts, newAccount]);
                    setUser({ email: newAccount.email, createdAt: newAccount.createdAt });
                    persistSession(newAccount.email);
                }),
            signOut: () =>
                runAuthAction(async () => {
                    persistSession(null);
                    setUser(null);
                }),
            requestPasswordReset: (email: string) =>
                runAuthAction(async () => {
                    const normalizedEmail = email.toLowerCase();
                    const accounts = getAccounts();
                    const existing = accounts.find((account) => account.email === normalizedEmail);
                    if (!existing) {
                        throw new Error("We couldn't find an account with that email.");
                    }
                    const otp = generateOtp();
                    const otpHash = await hashString(otp);
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
                    const tokens = getResetTokens().filter((token) => token.email !== normalizedEmail);
                    tokens.push({ email: normalizedEmail, otpHash, expiresAt });
                    persistResetTokens(tokens);
                    return otp;
                }),
            verifyPasswordReset: (email: string, otp: string, newPassword: string) =>
                runAuthAction(async () => {
                    const normalizedEmail = email.toLowerCase();
                    const tokens = getResetTokens();
                    const token = tokens.find((item) => item.email === normalizedEmail);
                    if (!token) {
                        throw new Error("No reset request found for this email. Please request a new code.");
                    }
                    if (new Date(token.expiresAt).getTime() < Date.now()) {
                        persistResetTokens(tokens.filter((item) => item.email !== normalizedEmail));
                        throw new Error("The OTP has expired. Please request a new code.");
                    }
                    const providedHash = await hashString(otp);
                    if (providedHash !== token.otpHash) {
                        throw new Error("Invalid OTP. Double-check the code and try again.");
                    }
                    const accounts = getAccounts();
                    const existingIndex = accounts.findIndex((account) => account.email === normalizedEmail);
                    if (existingIndex === -1) {
                        throw new Error("Account not found.");
                    }
                    const updatedAccounts = [...accounts];
                    updatedAccounts[existingIndex] = {
                        ...updatedAccounts[existingIndex],
                        passwordHash: await hashString(newPassword),
                    };
                    persistAccounts(updatedAccounts);
                    persistResetTokens(tokens.filter((item) => item.email !== normalizedEmail));
                    setUser({
                        email: updatedAccounts[existingIndex].email,
                        createdAt: updatedAccounts[existingIndex].createdAt,
                    });
                    persistSession(updatedAccounts[existingIndex].email);
                }),
            refreshSession: () =>
                runAuthAction(async () => {
                    const email = getSession();
                    const account = loadAccountForEmail(email);
                    if (account) {
                        setUser({ email: account.email, createdAt: account.createdAt });
                        return true;
                    }
                    persistSession(null);
                    setUser(null);
                    return false;
                }),
        };
    }, [user, loading, error]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
};

