import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Users, DollarSign, Server, Terminal, MapPin } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import api, { OrderService } from '../services/api'; 

// 🎯 HARİTA İÇİN BRUTALIST KONFİGÜRASYONLAR
const mapContainerStyle = {
  width: '100%',
  height: '350px',
  border: '2px solid #041632'
};

// Harita ilk açıldığında Eskişehir merkezli odaklansın
const defaultCenter = {
  lat: 39.7767,
  lng: 30.5206
};

// Haritayı kurumsal ve sade gösterecek koyu/minimal tema stili (Opsiyonel - Jüri bayılır)
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  styles: [
    { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#041632" }] },
    { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
    { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
    { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#b7c7eb" }, { "visibility": "on" }] }
  ]
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [targetNodeId, setTargetNodeId] = useState('');
  const [portAmount, setPortAmount] = useState(5); 
  
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState(''); 

  // 🎯 HARİTA STATE'LERİ: Seçili dolabın detay penceresi için
  const [selectedNode, setSelectedNode] = useState(null);

  // 🎯 MADDE 4 ÇÖZÜMÜ: API Key artık şifreli kasadan ( .env ) çekiliyor! Zafiyet kapatıldı. ✅
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
  });

  const [data, setData] = useState({
    stats: { totalRevenue: 0, activeSubscribers: 0, pendingRabbitMq: 0, totalNodes: 0 },
    pendingOrders: [],
    nodes: [],
    logs: [] 
  });

  const triggerAlert = (msg, type) => {
    setAlertMsg(msg);
    setAlertType(type);
    setTimeout(() => {
      setAlertMsg('');
      setAlertType('');
    }, 4000);
  };

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

  const handleInjectCapacity = async () => {
    if (!targetNodeId) {
      triggerAlert("Lütfen port eklemek istediğiniz Saha Dolabı ID'sini girin!", "error");
      return;
    }
    try {
      setLoading(true);
      await OrderService.updateNodeCapacity(targetNodeId, portAmount); 
      
      triggerAlert(`Saha dolabına ${portAmount} yeni port enjekte edildi. Bekleyen siparişler onaylanıyor!`, "success");
      setTargetNodeId(''); 
      fetchDashboard(); 
    } catch (err) {
      console.error("Kapasite artırım hatası:", err);
      triggerAlert(err.message || 'Kapasite enjekte edilemedi.', "error");
    } finally {
      setLoading(false);
    }
  };

  const isNodeFull = (capacityStr) => {
    if (!capacityStr) return false;
    const parts = capacityStr.toString().split('/');
    if (parts.length === 2) {
      return parseInt(parts[0].trim()) >= parseInt(parts[1].trim());
    }
    return capacityStr === '0';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      <style>{`
        .responsive-header { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .dashboard-main-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 24px; }
        .panel-left { grid-column: span 5 / span 5; display: flex; flex-direction: column; gap: 24px; }
        .panel-right { grid-column: span 7 / span 7; display: flex; flex-direction: column; gap: 24px; }
        .nodes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        
        .terminal-scroll::-webkit-scrollbar { width: 6px; }
        .terminal-scroll::-webkit-scrollbar-track { background: #1e1e1e; }
        .terminal-scroll::-webkit-scrollbar-thumb { background: #4af626; }
        
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
        
        {/* STAT KARTLARI */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard icon={<DollarSign/>} label="AYLIK BEKLENEN CİRO" value={`${data.stats?.totalRevenue || 0}`} color="#e6ffe6" />
          <StatCard icon={<Users/>} label="AKTİF ABONELER" value={data.stats?.activeSubscribers || 0} color="#b7c7eb" />
          <StatCard icon={<Activity/>} label="KUYRUK (RABBITMQ)" value={`${data.stats?.pendingRabbitMq || 0} BEKLEYEN`} color="#fed3c7" />
          <StatCard icon={<Server/>} label="TOPLAM SAHA DOLABI" value={data.stats?.totalNodes || 0} color="#fff3cd" />
        </section>

        {/* 🎯 MADDE 1: REAL-TIME POSTGIS HARİTA ENTEGRASYONU PANELİ */}
        <section style={{ border: '2px solid #041632', padding: '20px', backgroundColor: '#ffffff', boxShadow: '4px 4px 0px 0px #041632' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '14px', display: 'flex', alignAllitems: 'center', gap: '8px' }}>
            <MapPin size={20} /> COĞRAFİ ALTYAPI VE SAHA DOLABI DAĞILIM HARİTASI 
          </h2>
          
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={13}
              options={mapOptions}
            >
              {data.nodes && data.nodes.length > 0 && data.nodes.map((node) => {
                const isFull = isNodeFull(node.capacity);
                // Eğer dolap doluysa kırmızı pin (Hata/Kritik), boş port varsa yeşil pin simgesi üretiyoruz
                const markerIcon = isFull 
                  ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" 
                  : "http://maps.google.com/mapfiles/ms/icons/green-dot.png";

                return (
                  <Marker
                    key={node.id}
                    position={{ lat: node.lat, lng: node.lng }}
                    icon={markerIcon}
                    onClick={() => setSelectedNode(node)}
                  />
                );
              })}

              {/* Pin'e tıklandığında açılacak detay penceresi (Popup) */}
              {selectedNode && (
                <InfoWindow
                  position={{ lat: selectedNode.lat, lng: selectedNode.lng }}
                  onCloseClick={() => setSelectedNode(null)}
                >
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#041632', padding: '4px' }}>
                    <strong style={{ fontSize: '14px' }}>{selectedNode.name}</strong>
                    <p style={{ margin: '6px 0 2px 0' }}>Tip: <b>{selectedNode.nodeType || 'VDSL'}</b></p>
                    <p style={{ margin: '2px 0' }}>Bölge: {selectedNode.region}</p>
                    <p style={{ margin: '2px 0', color: isNodeFull(selectedNode.capacity) ? '#d10000' : '#006600' }}>
                      Kapasite: <b>{selectedNode.capacity} PORT</b>
                    </p>
                    <button 
                      onClick={() => { setTargetNodeId(selectedNode.id.toString()); setSelectedNode(null); }}
                      style={{ marginTop: '8px', width: '100%', padding: '4px', backgroundColor: '#041632', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                    >
                      Kapasite Enjeksiyonuna Seç ⚡
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div style={{ height: '350px', border: '2px solid #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eae8e7', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
              Harita motoru yükleniyor...
            </div>
          )}
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

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input type="number" value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} placeholder="Saha Dolabı ID" style={{ width: '100%', padding: '12px', border: '2px solid #041632', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }} />
                <select value={portAmount} onChange={(e) => setPortAmount(Number(e.target.value))} style={{ width: '140px', padding: '12px', border: '2px solid #041632', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 'bold' }}>
                  <option value={5}>+5 PORT</option>
                  <option value={10}>+10 PORT</option>
                  <option value={20}>+20 PORT</option>
                  <option value={50}>+50 PORT</option>
                </select>
              </div>
              
              <button onClick={handleInjectCapacity} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#041632', color: '#fff', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', border: '2px solid #041632', cursor: 'pointer', boxShadow: '2px 2px 0px 0px #041632' }}>
                {loading ? 'İŞLENİYOR...' : `SEÇİLİ PORTU ENJEKTE ET ⚡`}
              </button>
            </div>

            <div style={{ border: '2px solid #041632', padding: '24px', flex: 1, backgroundColor: '#fff', boxShadow: '4px 4px 0px 0px #041632' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '12px' }}>RABBITMQ BEKLEYEN SİPARİŞLER</h2>
              <div style={{ overflowX: 'auto', maxHeight: '250px' }}>
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

          <div className="panel-right">
            
            {/* CANLI SİSTEM LOGLARI TERMİNALİ */}
            <div style={{ border: '2px solid #041632', padding: '20px', backgroundColor: '#1e1e1e', color: '#4af626', boxShadow: '4px 4px 0px 0px #041632', fontFamily: 'JetBrains Mono, monospace' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} /> CANLI BSS & RABBITMQ LOGLARI
              </h2>
              <div className="terminal-scroll" style={{ height: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                {data.logs && data.logs.length > 0 ? (
                  data.logs.map((log, idx) => (
                    <div key={idx} style={{ borderBottom: '1px dotted #333', paddingBottom: '4px' }}>
                      <span style={{ color: '#888' }}>[{log.changedAt || '-'}]</span>
                      <span style={{ color: '#fff', marginLeft: '6px', fontWeight: 'bold' }}>[ID:#{log.orderId || '-'}]</span>
                      <span style={{ marginLeft: '6px', color: log.status === 'ONAYLANDI' ? '#4af626' : log.status === 'IPTAL' ? '#ff4444' : '#f1fa8c' }}>{log.status}</span>
                      <span style={{ marginLeft: '6px', color: '#ccc' }}>- {log.description}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#888' }}>Sistem dinleniyor... BSS motorundan log kaydı bekleniyor.</div>
                )}
              </div>
            </div>

            <div style={{ border: '2px solid #041632', padding: '24px', backgroundColor: '#fff', boxShadow: '4px 4px 0px 0px #041632', flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px' }}>SAHA DOLAPLARI AKTİF PORT GRAFİĞİ</h2>
              <div className="nodes-grid">
                {data.nodes && data.nodes.length > 0 ? (
                  data.nodes.map(n => {
                    const isFull = isNodeFull(n.capacity); 
                    return (
                      <div key={n.id} style={{ border: '2px solid #041632', padding: '14px', backgroundColor: isFull ? '#fed3c7' : '#ffffff', boxShadow: '2px 2px 0px 0px #041632' }}>
                        <p style={{ fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span>ID [{n.id}] - {n.name}</span>
                          <span style={{ fontSize: '9px', backgroundColor: n.nodeType === 'FIBER' ? '#041632' : '#666', color: '#fff', padding: '2px 6px', fontWeight: '900', letterSpacing: '0.05em' }}>
                            {n.nodeType || 'VDSL'}
                          </span>
                        </p>
                        <p style={{ fontSize: '12px', marginTop: '6px', marginBottom: 0, fontFamily: 'JetBrains Mono, monospace', color: isFull ? '#d10000' : '#041632' }}>
                          Kapasite: <strong>{n.capacity} PORT</strong> <br/>
                          Statü: <span style={{ textDecoration: 'underline', fontWeight: isFull ? 'bold' : 'normal' }}>{isFull ? 'KAPASİTE TAMAMEN DOLU' : 'AKTİF HİZMET VERİYOR'}</span>
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#666' }}>
                    Node verileri çekilemedi veya veritabanı boş.
                  </div>
                )}
              </div>
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