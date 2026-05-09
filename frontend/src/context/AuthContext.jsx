import { createContext, useContext, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY, apiRequest } from "../lib/api.js";
const AuthContext = createContext(null);

function clearStoredToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function storeToken(token) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function hydrateUser(activeToken) {
    const response = await apiRequest("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    setUser(response.user);
    return response.user;
  }

  function applySession(nextToken, nextUser) {
    storeToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return null;
    return hydrateUser(token);
  }

  async function login(credentials) {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });

    applySession(response.token, response.user);
    return response.user;
  }

  async function register(payload) {
    const response = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    applySession(response.token, response.user);
    return response.user;
  }

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        await hydrateUser(token);
      } catch (error) {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        logout,
        register,
        refreshUser,
        token,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export { AuthProvider, useAuth };
