import { createContext, useState, useContext, useEffect } from "react";
import { api } from "@/api/client";
const AuthContext = createContext(/** @type {any} */ (null));
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkUserAuth = async () => {
    try {
      setUser(await api.auth.me());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    checkUserAuth();
  }, []);
  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    window.location.assign("/login");
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user?.role === "admin",
        isLoadingAuth: loading,
        isLoadingPublicSettings: false,
        authError: null,
        authChecked: !loading,
        logout,
        navigateToLogin: api.auth.redirectToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
