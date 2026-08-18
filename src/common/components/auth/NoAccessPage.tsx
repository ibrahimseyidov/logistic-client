import { Link } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";

/** İcazəsiz giriş — istifadəçini boş səhifəyə buraxmamaq üçün */
export default function NoAccessPage() {
  const { canView } = usePermissions();

  const fallbacks: { to: string; label: string; mod: string; child?: string }[] =
    [
      { to: "/dashboard", label: "Dashboard", mod: "dashboard", child: "overview" },
      { to: "/sorgular", label: "Sorğular", mod: "sorgular", child: "active" },
      { to: "/sifarisler", label: "Sifarişlər", mod: "sifarisler", child: "orders" },
      { to: "/tapshiriqlar", label: "Tapşırıqlar", mod: "tapshiriqlar", child: "board" },
      { to: "/musteriler", label: "Müştərilər", mod: "musteriler", child: "list" },
      { to: "/dasiyicilar", label: "Daşıyıcılar", mod: "dasiyicilar", child: "list" },
      { to: "/maliyye", label: "Maliyyə", mod: "maliyye" },
      { to: "/ayarlar", label: "Parametrlər", mod: "ayarlar", child: "users" },
    ];

  const allowed = fallbacks.filter((f) => canView(f.mod, f.child));

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "4rem auto",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>
        Giriş icazəsi yoxdur
      </h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Bu səhifəni görmək üçün icazəniz bağlıdır. Parametrlərdə sizə verilən
        səhifələrdən birini seçin.
      </p>
      {allowed.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            justifyContent: "center",
          }}
        >
          {allowed.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              style={{
                padding: "0.5rem 0.9rem",
                background: "#1d4ed8",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              {f.label}
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: "#b91c1c" }}>
          Heç bir səhifəyə icazəniz yoxdur. Administratorla əlaqə saxlayın.
        </p>
      )}
    </div>
  );
}
