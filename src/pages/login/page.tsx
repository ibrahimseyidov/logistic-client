import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchAuthBootstrap,
  loginAction,
} from "../../common/actions/auth.actions";
import { useAuth } from "../../common/contexts/AuthContext";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("companyName", companyName);
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
    <div className="min-h-screen flex bg-gray-100">
      <div className="hidden md:flex w-[60%] bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center">
        {/* Sol panel görsel veya marka için kullanılabilir */}
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div
          className="w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl bg-white rounded-xl shadow-lg p-8"
          style={{ width: "100%", maxWidth: "400px", minWidth: "260px" }}
        >
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-blue-700">Logistra Logo</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Brend
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brend"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Şifrə
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? "Daxil olunur..." : "Daxil ol"}
            </button>
          </form>
          {error && (
            <div className="mt-4 text-red-600 text-center text-sm">{error}</div>
          )}
          <div className="mt-8 text-center text-gray-400 text-xs">
            <p>© Logistra - 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
