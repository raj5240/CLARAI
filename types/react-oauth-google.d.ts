import type React from "react";

declare module "@react-oauth/google" {
    interface GoogleOAuthProviderProps {
        clientId: string;
        children: React.ReactNode;
    }

    export const GoogleOAuthProvider: React.FC<GoogleOAuthProviderProps>;
}

