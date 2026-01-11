import React from "react";
import { Me, me as apiMe, setToken } from "./api";

type AuthState = { me: Me; loading: boolean };
type AuthCtx = AuthState & { refresh: () => Promise<void>; logout: () => void };

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ me: null, loading: true });

  const refresh = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const m = await apiMe();
    setState({ me: m, loading: false });
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const logout = React.useCallback(() => {
    setToken(null);
    setState({ me: null, loading: false });
  }, []);

  return <Ctx.Provider value={{ ...state, refresh, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
