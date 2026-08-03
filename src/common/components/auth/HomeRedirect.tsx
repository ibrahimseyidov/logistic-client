import { Navigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../contexts/AuthContext";

const CANDIDATES: { to: string; mod: string; child?: string }[] = [
  { to: "/sorgular", mod: "sorgular", child: "active" },
  { to: "/sifarisler", mod: "sifarisler", child: "orders" },
  { to: "/tapshiriqlar", mod: "tapshiriqlar", child: "board" },
  { to: "/musteriler", mod: "musteriler", child: "list" },
  { to: "/dasiyicilar", mod: "dasiyicilar", child: "list" },
  { to: "/maliyye", mod: "maliyye" },
  { to: "/ayarlar", mod: "ayarlar", child: "users" },
];

/** İlk icazəli səhifəyə yönləndir */
export default function HomeRedirect() {
  const { authReady } = useAuth();
  const { canView } = usePermissions();

  if (!authReady) return null;

  const first = CANDIDATES.find((c) => canView(c.mod, c.child));
  return <Navigate to={first?.to || "/no-access"} replace />;
}
