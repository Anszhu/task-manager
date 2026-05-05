import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { apiRequest, ApiError } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  booting: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const storageKey = "team-task-manager.token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: preact.ComponentChildren }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const persistSession = (nextToken: string, nextUser: User) => {
    localStorage.setItem(storageKey, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem(storageKey);

    if (!savedToken) {
      setBooting(false);
      return;
    }

    apiRequest<User>("/auth/me", { token: savedToken })
      .then(({ data }) => {
        setToken(savedToken);
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem(storageKey);
        setToken(null);
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const login = async (payload: { email: string; password: string }) => {
    const { data } = await apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: payload
    });
    persistSession(data.token, data.user);
  };

  const signup = async (payload: { name: string; email: string; password: string }) => {
    const { data } = await apiRequest<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: payload
    });
    persistSession(data.token, data.user);
  };

  const logout = async () => {
    if (token) {
      try {
        await apiRequest("/auth/logout", { method: "POST", token });
      } catch (error) {
        if (!(error instanceof ApiError)) {
          throw error;
        }
      }
    }

    localStorage.removeItem(storageKey);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        booting,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
