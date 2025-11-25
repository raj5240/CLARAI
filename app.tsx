import React, { useMemo, useState } from 'react';
import { ActiveModule } from './types';
import ModuleChatReason from './components/ModuleChatReason';
import ModuleVision from './components/ModuleVision';
import ModuleImagine from './components/ModuleImagine';
import AuthForm from './components/AuthForm';
import { useAuth } from './context/AuthContext';
import { Bot, Image as ImageIcon, Palette, Sparkles, LogOut, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading, signOut, error } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [activeModule, setActiveModule] = useState<ActiveModule>(ActiveModule.CHAT_REASON);

  const userInitials = useMemo(() => {
    if (!user?.email) return "U";
    const [name] = user.email.split("@");
    const parts = name.replace(/[^a-zA-Z0-9]/g, " ").split(" ").filter(Boolean);
    if (!parts.length) return user.email[0]?.toUpperCase() ?? "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    if (!user?.email) return "Guest";
    const raw = user.email.split("@")[0] ?? "Guest";
    if (!raw.length) return "Guest";
    return raw
      .split(/[._-]/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }, [user]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return null;
    try {
      return new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }, [user]);

  const renderModule = () => {
    switch (activeModule) {
      case ActiveModule.CHAT_REASON:
        return <ModuleChatReason />;
      case ActiveModule.VISION:
        return <ModuleVision />;
      case ActiveModule.IMAGINE:
        return <ModuleImagine />;
      default:
        return <ModuleChatReason />;
    }
  };

  const NavButton: React.FC<{ module: ActiveModule; icon: React.ElementType; label: string; colorClass: string }> = ({ module, icon: Icon, label, colorClass }) => (
    <button
      onClick={() => setActiveModule(module)}
      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group ${activeModule === module
        ? `bg-gray-800 text-white shadow-lg ${colorClass.replace('text-', 'shadow-')}/20`
        : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
        }`}
    >
      <div className={`p-2 rounded-lg ${activeModule === module ? 'bg-gray-700' : 'bg-gray-950 group-hover:bg-gray-800'} transition-colors`}>
        <Icon className={`w-5 h-5 ${activeModule === module ? colorClass : 'text-gray-500 group-hover:text-gray-300'}`} />
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400">Preparing your AI workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-indigo-400" />
              OmniGen AI Studio
            </h1>
            <p className="text-gray-300 leading-relaxed">
              Sign in to unlock multi-modal AI capabilities—advanced chat reasoning, image analysis, and imaginative generation.
              Your sessions sync securely with your account so you can pick up where you left off.
            </p>
            <ul className="grid gap-3 text-sm text-gray-400">
              <li>• Save and revisit your chat sessions across devices.</li>
              <li>• Toggle Deep Thinking for complex reasoning on demand.</li>
              <li>• Seamless access to vision analysis and image generation tools.</li>
            </ul>
            {error && (
              <div className="text-sm text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>
          <AuthForm mode={authMode} onModeChange={setAuthMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-950 border-r border-gray-900 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              OmniGen AI
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Next-Gen AI Capabilities</p>
        </div>

        <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-900">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-semibold text-white">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={user?.email ?? undefined}>
              {displayName}
            </p>
            {memberSince ? (
              <p className="text-xs text-gray-500">Member since {memberSince}</p>
            ) : null}
            <button
              onClick={() => signOut().catch(() => void 0)}
              className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavButton
            module={ActiveModule.CHAT_REASON}
            icon={Bot}
            label="Chat & Reason"
            colorClass="text-indigo-400"
          />
          <NavButton
            module={ActiveModule.VISION}
            icon={ImageIcon}
            label="Vision Analyst"
            colorClass="text-emerald-400"
          />
          <NavButton
            module={ActiveModule.IMAGINE}
            icon={Palette}
            label="Imagine"
            colorClass="text-pink-400"
          />
        </nav>

        <div className="p-4 m-4 bg-gray-900 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-500 leading-relaxed">
            This showcase demonstrates robust multimodal AI capabilities, addressing common integration challenges with a stable React implementation.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 h-full overflow-hidden bg-black/20">
        {renderModule()}
      </main>
    </div>
  );
};

export default App;

