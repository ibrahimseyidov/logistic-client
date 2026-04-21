import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAuthBootstrap,
  loginAction,
} from "../../common/actions/auth.actions";
import { useAuth } from "../../common/contexts/AuthContext";
import styles from "./login.module.css";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("elmir.ahmadov2@gmail.com");
  const [password, setPassword] = useState("Elmir123ase!");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      const userData = await loginAction(formData);
      if (userData && userData.token) {
        localStorage.setItem("token", userData.token);
        localStorage.setItem("refreshToken", userData.refreshToken);
        document.cookie = `token=${userData.token}; path=/; max-age=86400`;
        const bootstrapData = await fetchAuthBootstrap();
        login(bootstrapData, userData.token);
        navigate("/sorgular", { replace: true });
      } else {
        setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        {/* Sol panel görsel veya marka için kullanılabilir */}
      </div>
      <div className={styles.centerPanel}>
        <div className={styles.card}>
          <div className={styles.title}>
            <h2 className={styles.titleText}>Logistra Logo</h2>
            <p className={styles.demoText}>
              Demo giriş: ibrahim@gmail.com / 1234
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "0.5rem 0.75rem",
                  outline: "none",
                  fontSize: "1rem",
                  marginBottom: 0,
                }}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Şifrə
              </label>
              <input
                type="password"
                id="password"
                name="password"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "0.5rem 0.75rem",
                  outline: "none",
                  fontSize: "1rem",
                  marginBottom: 0,
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                padding: "0.5rem 0",
                borderRadius: 6,
                fontSize: "1rem",
                border: 0,
                cursor: "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition: "background 0.2s",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Daxil olunur..." : "Daxil ol"}
            </button>
          </form>
          {error && (
            <div
              style={{
                marginTop: 16,
                color: "#dc2626",
                textAlign: "center",
                fontSize: "0.95rem",
              }}
            >
              {error}
            </div>
          )}
          <div
            style={{
              marginTop: 32,
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "0.8rem",
            }}
          >
            <p>© Logistra - 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
