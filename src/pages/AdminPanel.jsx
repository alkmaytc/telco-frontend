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
  
  // CANLI VERİLERİ TUTACAĞIMIZ STATE
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
      
      <header style={{ borderBottom: '2px solid #041632', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#ffffff' }}>
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
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          
          <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* KAPASİTE ENJEKSİYONU */}
            <div style={{ border: '2px solid #041632', padding: '24px', backgroundColor: '#fff' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '16px' }}>DİNAMİK KAPASİTE ENJEKSİYONU</h2>
              <input type="number" value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} placeholder="Node ID" style={{ width: '100%', padding: '12px', border: '2px solid #041632', marginBottom: '10px' }} />
              <button onClick={handleInjectCapacity} style={{ width: '100%', padding: '12px', backgroundColor: '#041632', color: '#fff' }}>+5 PORT EKLE</button>
            </div>

            {/* SİPARİŞLER */}
            <div style={{ border: '2px solid #041632', padding: '24px', flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: '900' }}>RABBITMQ BEKLEYENLER</h2>
              {data.pendingOrders.map(o => (
                <div key={o.id} style={{ borderBottom: '1px solid #ccc', padding: '8px 0', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
                  #{o.id} - {o.bbk} - {o.pkg}
                </div>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: 'span 7', border: '2px solid #041632', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px' }}>SAHA DOLAPLARI</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {data.nodes.map(n => (
                <div key={n.id} style={{ border: '2px solid #041632', padding: '12px', backgroundColor: n.color }}>
                  <p style={{ fontWeight: 'bold' }}>{n.name}</p>
                  <p style={{ fontSize: '12px' }}>{n.capacity} PORT | {n.status}</p>
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
    <div style={{ border: '2px solid #041632', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fff' }}>
      <div style={{ border: '2px solid #041632', padding: '12px', backgroundColor: color }}>{icon}</div>
      <div>
        <span style={{ fontSize: '10px', color: '#666' }}>{label}</span>
        <div style={{ fontSize: '20px', fontWeight: '900' }}>{value}</div>
      </div>
    </div>
  );
}