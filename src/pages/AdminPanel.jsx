import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, ArrowLeft, Zap, ShieldAlert, Server, Users, HardDrive, Terminal, ListOrdered, DollarSign } from 'lucide-react';
import { OrderService } from '../services/api';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [targetNodeId, setTargetNodeId] = useState('');
  
  const [data, setData] = useState(null);

  // --- GÜVENLİK ---
  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'ADMIN') {
      navigate('/', { replace: true });
    } else {
      setIsAuthorized(true);
    }
  }, [navigate]);

  // --- BACKEND'DEN CANLI VERİ ÇEKME ---
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/v1/admin/dashboard');
        setData(response.data);
      } catch (err) {
        console.error("Dashboard verisi alınamadı:", err);
      }
    };
    fetchDashboard();
  }, []);

  // --- GERÇEK API ÇAĞRISI (PORT ENJEKSİYONU) ---
  const handleInjectCapacity = async () => {
    if (!targetNodeId) {
      alert("Lütfen port eklemek istediğiniz Saha Dolabı (Node) ID'sini girin!");
      return;
    }
    try {
      setLoading(true);
      const response = await OrderService.updateNodeCapacity(targetNodeId, 5);
      alert(`⚡ SİSTEM MESAJI: ${response.data}`);
      setTargetNodeId(''); 
    } catch (err) {
      console.error("Kapasite artırım hatası:", err);
      alert("HATA: Kapasite artırılamadı.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) return <div style={{padding: '50px', textAlign: 'center'}}>GÜVENLİK KONTROLÜ...</div>;
  if (!data) return <div style={{padding: '50px', textAlign: 'center'}}>SİSTEM VERİLERİ YÜKLENİYOR...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      {/* RESPONSIVE CSS INJECTION */}
      <style>{`
        .responsive-header {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .dashboard-main-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 24px;
        }
        .panel-left {
          grid-column: span 5 / span 5;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .panel-right {
          grid-column: span 7 / span 7;
        }
        .nodes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* TABLET & MOBİL GÖRÜNÜM */
        @media (max-width: 1024px) {
          .dashboard-main-grid {
            display: flex;
            flex-direction: column;
          }
          .panel-left, .panel-right {
            width: 100%;
          }
        }

        /* DAR MOBİL EKRANLAR */
        @media (max-width: 768px) {
          .nodes-grid {
            grid-template-columns: 1fr; /* Dolaplar mobilde alt alta gelsin */
          }
          .stat-card {
            padding: 16px !important;
          }
          .stat-card-title {
            font-size: 16px !important;
          }
        }
      `}</style>

      <header className="responsive-header" style={{ borderBottom: '2px solid #041632', padding: '16px 24px', backgroundColor: '#ffffff' }}>
        <button onClick={() => navigate('/')} style={{ border: '2px solid #041632', backgroundColor: 'transparent', padding: '6px', cursor: 'pointer' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
        </button>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: '800' }}>tel-co</span>
      </header>

      <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ROW 1: CANLI METRİKLER */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard icon={<DollarSign/>} label="AYLIK BEKLENEN CİRO" value={data.stats.totalRevenue} color="#e6ffe6" />
          <StatCard icon={<Users/>} label="AKTİF ABONELER" value={data.stats.activeSubscribers} color="#b7c7eb" />
          <StatCard icon={<Activity/>} label="KUYRUK (RABBITMQ)" value={`${data.stats.pendingRabbitMq} BEKLEYEN`} color="#fed3c7" />
        </section>

        {/* ROW 2: İŞLEM VE TABLOLAR */}
        <section className="dashboard-main-grid">
          
          {/* SOL PANEL */}
          <div className="panel-left">
            {/* KAPASİTE ENJEKSİYONU */}
            <div style={{ border: '2px solid #041632', padding: '24px', backgroundColor: '#fff' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>DİNAMİK KAPASİTE ENJEKSİYONU</h2>
              <input type="number" value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} placeholder="Node ID" style={{ width: '100%', padding: '12px', border: '2px solid #041632', marginBottom: '10px', fontFamily: 'JetBrains Mono, monospace' }} />
              <button onClick={handleInjectCapacity} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#041632', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? 'İŞLENİYOR...' : '+5 PORT EKLE'}
              </button>
            </div>

            {/* SİPARİŞLER */}
            <div style={{ border: '2px solid #041632', padding: '24px', flex: 1, backgroundColor: '#fff' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '12px' }}>RABBITMQ BEKLEYENLER</h2>
              <div style={{ overflowX: 'auto' }}>
                {data.pendingOrders.map(o => (
                  <div key={o.id} style={{ borderBottom: '1px solid #eae8e7', padding: '8px 0', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
                    <strong>#{o.id}</strong> - {o.bbk} - {o.pkg}
                  </div>
                ))}
                {data.pendingOrders.length === 0 && (
                  <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#666' }}>Kuyruk boş.</div>
                )}
              </div>
            </div>
          </div>

          {/* SAĞ PANEL */}
          <div className="panel-right" style={{ border: '2px solid #041632', padding: '24px', backgroundColor: '#fff' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px' }}>SAHA DOLAPLARI</h2>
            <div className="nodes-grid">
              {data.nodes.map(n => (
                <div key={n.id} style={{ border: '2px solid #041632', padding: '12px', backgroundColor: n.color }}>
                  <p style={{ fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>{n.name}</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>{n.capacity} PORT | <strong>{n.status}</strong></p>
                </div>
              ))}
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
      <div style={{ border: '2px solid #041632', padding: '12px', backgroundColor: color }}>{icon}</div>
      <div>
        <span style={{ fontSize: '10px', color: '#666', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}>{label}</span>
        <div className="stat-card-title" style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      </div>
    </div>
  );
}