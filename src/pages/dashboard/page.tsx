export default function DashboardPage() {
  const stats = [
    { title: "Toplam Ürün", value: "150", icon: "📦" },
    { title: "Aktif Kategoriler", value: "12", icon: "📂" },
    { title: "Toplam Satış", value: "₺45,000", icon: "💰" },
    { title: "Yeni Siparişler", value: "8", icon: "🛒" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-5 px-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-5 rounded-lg shadow flex items-center gap-4"
        >
          <div className="text-3xl">{stat.icon}</div>
          <div>
            <h3 className="m-0 text-xl font-semibold text-gray-800">
              {stat.value}
            </h3>
            <p className="mt-1 text-gray-500 text-sm">{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
