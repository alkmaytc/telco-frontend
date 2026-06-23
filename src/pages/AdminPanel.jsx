import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Users, DollarSign } from 'lucide-react';
import api, { OrderService } from '../services/api'; 

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [targetNodeId, setTargetNodeId] = useState('');
  
  // 🎯 BİLDİRİM STATE'LERİ
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState(''); 

  const [data, setData] = useState({
    stats: { totalRevenue: 0, activeSubscribers: 0, pendingRabbitMq: 0 },
    pendingOrders: [],
    nodes: []
  });

  const triggerAlert = (msg, type) => {
    setAlertMsg(msg);
    setAlertType(type);
    setTimeout(() => {
      setAlertMsg('');
      setAlertType('');
    }, 4000);
  };

  // 🔄 BACKEND'DEN CANLI VERİ ÇEKME (Yetki kontrolü tamamen ProtectedRoute'a bırakıldı ✅)
  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard'); 
      if (response && response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error("Dashboard verisi alınamadı:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const intervalId = setInterval(fetchDashboard, 4000);
    return () => clearInterval(intervalId);
  }, []);

  // ⚡ PORT ENJEKSİYONU VE KUYRUK ERİTME MOTORU
  const handleInjectCapacity = async () => {
    if (!targetNodeId) {
      triggerAlert("Lütfen port eklemek istediğiniz Saha Dolabı ID'sini girin!", "error");
      return;
    }
    try {
      setLoading(true);
      await OrderService.updateNodeCapacity(targetNodeId, 5); 
      
      triggerAlert(`Saha dolabına 5 yeni port enjekte edildi. Bekleyen siparişler onaylanıyor!`, "success");
      setTargetNodeId(''); 
      fetchDashboard(); 
    } catch (err) {
      console.error("Kapasite artırım hatası:", err);
      triggerAlert(err.message || 'Kapasite enjekte edilemedi.', "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      <style>{`
        .responsive-header { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .dashboard-main-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 24px; }
        .panel-left { grid-column: span 5 / span 5; display: flex; flex-direction: column; gap: 24px; }
        .panel-right { grid-column: span 7 / span 7; }
        .nodes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 1024px) { .dashboard-main-grid { display: flex; flex-direction: column; } .panel-left, .panel-right { width: 100%; } }
        @media (max-width: 768px) { .nodes-grid { grid-template-columns: 1fr; } .stat-card { padding: 16px !important; } .stat-card-title { font-size: 16px !important; } }
      `}</style>

      <header className="responsive-header" style={{ borderBottom: '2px solid #041632', padding: '16px 24px', backgroundColor: '#ffffff' }}>
        <button onClick={() => navigate('/')} style={{ border: '2px solid #041632', backgroundColor: 'transparent', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
        </button>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.05em' }} onClick={() => navigate('/')}>tel-co</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', border: '2px solid #041632', padding: '4px 8px', backgroundColor: '#b7c7eb', fontWeight: '700' }}>
          KORUMALI ALTYAPI YÖNETİM MERKEZİ 🔧
        </span>
      </header>

      <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard icon={<DollarSign/>} label="AYLIK BEKLENEN CİRO" value={`${data.stats?.totalRevenue || 0} ₺`} color="#e6ffe6" />
          <StatCard icon={<Users/>} label="AKTİF ABONELER" value={data.stats?.activeSubscribers || 0} color="#b7c7eb" />
          <StatCard icon={<Activity/>} label="KUYRUK (RABBITMQ)" value={`${data.stats?.pendingRabbitMq || 0} BEKLEYEN`} color="#fed3c7" />
        </section>

        <section className="dashboard-main-grid">
          <div className="panel-left">
            <div style={{ border: '2px solid #041632', padding: '24px', backgroundColor: '#fff', boxShadow: '4px 4px 0px 0px #041632' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>DİNAMİK KAPASİTE ENJEKSİYONU</h2>
              
              {alertMsg && (
                <div style={{ 
                  border: '2px solid #041632', 
                  backgroundColor: alertType === 'success' ? '#e6ffe6' : '#fed3c7', 
                  padding: '12px', 
                  marginBottom: '12px', 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  boxShadow: '2px 2px 0px 0px #041632',
                  textAlign: 'center'
                }}>
                  {alertType === 'success' ? '✅ SUCCESS: ' : '❌ ERROR: '} {alertMsg}
                </div>
              )}

              <input type="number" value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} placeholder="Saha Dolabı (Node) ID Giriniz" style={{ width: '100%', padding: '12px', border: '2px solid #041632', marginBottom: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }} />
              <button onClick={handleInjectCapacity} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#041632', color: '#fff', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', border: '2px solid #041632', cursor: 'pointer', boxShadow: '2px 2px 0px 0px #041632' }}>
                {loading ? 'İŞLENİYOR...' : '+5 PORT ENJEKTE ET ⚡'}
              </button>
            </div>

            <div style={{ border: '2px solid #041632', padding: '24px', flex: 1, backgroundColor: '#fff', boxShadow: '4px 4px 0px 0px #041632' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '12px' }}>RABBITMQ BEKLEYENLER</h2>
              <div style={{ overflowX: 'auto' }}>
                {data.pendingOrders && data.pendingOrders.length > 0 ? (
                  data.pendingOrders.map(o => (
                    <div key={o.id} style={{ borderBottom: '1px solid #eae8e7', padding: '10px 0', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
                      <strong>Sipariş No: #{o.id}</strong> <br/>
                      <span style={{color: '#666'}}>BBK: {o.bbk} | Paket: {o.pkg}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#666', paddingTop: '10px' }}>
                    Kuyrukta bekleyen işlem yok, telekomünikasyon şebekesi stabil.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel-right" style={{ border: '2px solid #041632', padding: '24px', backgroundColor: '#fff', boxShadow: '4px 4px 0px 0px #041632' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px' }}>SAHA DOLAPLARI AKTİF PORT GRAFİĞİ</h2>
            <div className="nodes-grid">
              {data.nodes && data.nodes.length > 0 ? (
                data.nodes.map(n => (
                  <div key={n.id} style={{ border: '2px solid #041632', padding: '14px', backgroundColor: n.capacity === 0 ? '#fed3c7' : '#ffffff', boxShadow: '2px 2px 0px 0px #041632' }}>
                    <p style={{ fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', margin: 0 }}>ID [{n.id}] - {n.name}</p>
                    <p style={{ fontSize: '12px', marginTop: '6px', marginBottom: 0, fontFamily: 'JetBrains Mono, monospace', color: n.capacity === 0 ? 'red' : '#041632' }}>
                      Kapasite: <strong>{n.capacity} PORT</strong> <br/>
                      Statü: <span style={{ textDecoration: 'underline' }}>{n.capacity === 0 ? 'KAPASİTE DOLU' : 'AKTİF'}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#666' }}>
                  Node verileri çekilemedi veya veritabanı boş.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({icon, label, value, color}) {
  return (
    <div className="stat-card" style={{ border: '2px solid #041632', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fff', boxShadow: '4px 4px 0px 0px #041632' }}>
      <div style={{ border: '2px solid #041632', padding: '12px', backgroundColor: color, display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div>
        <span style={{ fontSize: '10px', color: '#666', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}>{label}</span>
        <div className="stat-card-title" style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{value}</div>
      </div>
    </div>
  );
}