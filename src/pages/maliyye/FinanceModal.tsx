import { useState, useEffect } from "react";
import styles from "../../common/components/table/table.module.css";
import drawerStyles from "../sorgular/sorgular.module.css";
import { fetchCustomersAction } from "../../common/actions/customer.actions";
import { fetchCarriersAction } from "../../common/actions/carrier.actions";

export default function FinanceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  initialData?: any;
}) {
  const [formData, setFormData] = useState({
    type: "EXPENSE",
    category: "",
    name: "",
    amount: "",
    currency: "AZN",
    paymentMethod: "Bank",
    customerId: "",
    carrierId: "",
    orderId: ""
  });
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomersAction().then(setCustomers);
    fetchCarriersAction().then(setCarriers);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "EXPENSE",
        category: initialData.category || "",
        name: initialData.name || "",
        amount: initialData.amount ? String(initialData.amount) : "",
        currency: initialData.currency || "AZN",
        paymentMethod: initialData.paymentMethod || "Bank",
        customerId: initialData.customerId ? String(initialData.customerId) : "",
        carrierId: initialData.carrierId ? String(initialData.carrierId) : "",
        orderId: initialData.orderId ? String(initialData.orderId) : ""
      });
    } else {
      setFormData({
        type: "EXPENSE", category: "", name: "", amount: "", currency: "AZN", paymentMethod: "Bank", customerId: "", carrierId: "", orderId: ""
      });
    }
  }, [initialData, isOpen]);

  return (
    <>
      <div 
        className={`${drawerStyles.overlay} ${isOpen ? drawerStyles.overlayOpen : ''}`} 
        onClick={onClose} 
      />
      <div className={`${drawerStyles.drawer} ${isOpen ? drawerStyles.drawerOpen : ''}`}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{initialData ? 'Tranzaksiyanı redaktə et' : 'Yeni Tranzaksiya'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
        </div>
        
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', height: 'calc(100vh - 150px)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
              Tip
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <option value="INCOME">Gəlir (Ödəniş qəbulu)</option>
                <option value="EXPENSE">Xərc (Ödəniş edilib)</option>
              </select>
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
              Ödəniş metodu
              <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <option value="Bank">Bank</option>
                <option value="Nağd">Nağd</option>
                <option value="Kart">Kart</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
            Kateqoriya (Məs: Nəqliyyat, Əməkhaqqı, Avans)
            <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
            Ad / Açıqlama
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </label>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
              Məbləğ
              <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
              Valyuta
              <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <option value="AZN">AZN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
            Müştəri ilə əlaqələndir
            <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value, carrierId: ""})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
              <option value="">-- Seçilməyib --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.company}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
            Daşıyıcı ilə əlaqələndir
            <select value={formData.carrierId} onChange={e => setFormData({...formData, carrierId: e.target.value, customerId: ""})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
              <option value="">-- Seçilməyib --</option>
              {carriers.map(c => <option key={c.id} value={c.id}>{c.name || c.company}</option>)}
            </select>
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600, color: '#334155' }}>
            Sifariş nömrəsi (İstəyə bağlı)
            <input type="number" value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </label>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', background: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Ləğv et</button>
          <button onClick={() => onSave(formData)} style={{ padding: '0.6rem 1.25rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Yadda saxla</button>
        </div>
      </div>
    </>
  );
}
