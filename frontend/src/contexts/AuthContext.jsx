import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("@littleville:user");
    const storedToken = localStorage.getItem("@littleville:token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function signIn(email, password, isAdmin = false) {
    const response = await api.post("/auth/login", { email, password, isAdmin });
    const { user, token } = response.data;

    localStorage.setItem("@littleville:user", JSON.stringify(user));
    localStorage.setItem("@littleville:token", token);

    setUser(user);
    return user;
  }

  async function signUp(name, email, password, isAdmin = false) {
    const response = await api.post("/auth/register", { name, email, password, isAdmin });
    return response.data.user;
  }

  function signOut() {
    localStorage.removeItem("@littleville:user");
    localStorage.removeItem("@littleville:token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
