import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Terminal, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { OrderService } from '../services/api';
import { AuthContext } from '../context/AuthContext'; // 🎯 Oturum havuzunu içeri aldık kanka

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, setRedirectTo } = useContext(AuthContext); // 🎯 Kullanıcı oturum state'leri

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState([]);

  // Manuel tetiklenen, loading ikonunu döndüren ana fonksiyon
  const fetchOrderHistory = async () => {
    // GİZLİLİK KURALI: Eğer kullanıcı oturum açmadıysa backend'e istek atıp hata almasını engelliyoruz
    if (!user) return;

    setLoading(true);
    setError(false);
    try {
      const res = await OrderService.getOrderHistory(orderId);
      setHistory(res.data);
    } catch (err) {
      console.error("Loglar çekilemedi:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa ilk açıldığında çalışır
  useEffect(() => {
    if (orderId && user) {
      fetchOrderHistory();
    }
  }, [orderId, user]);

  // 🚀 OTOMATİK DİNLEME (AUTO-POLLING) SİSTEMİ
  useEffect(() => {
    // Eğer kullanıcı giriş yapmadıysa arka plan polling sayacını hiç başlatmıyoruz kanka
    if (!user) return;

    // En son düşen logu al
    const sonLog = history[history.length - 1];
    
    // Eğer log "PORT_BEKLENIYOR" ise kuyruk dinleniyor demektir
    const beklemedeMi = sonLog && sonLog.status === 'PORT_BEKLENIYOR';

    let intervalId;
    if (beklemedeMi && orderId) {
      // Her 2.5 saniyede bir arka planda sessizce backend'e sor
      intervalId = setInterval(() => {
        OrderService.getOrderHistory(orderId)
          .then(res => setHistory(res.data))
          .catch(err => console.error("Oto-Tazeleme hatası:", err));
      }, 2500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [history, orderId, user]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      {/* RESPONSIVE CSS INJECTION */}
      <style>{`
        .responsive-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .tracking-main-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          width: 100%;
          flex: 1;
        }
        .tracking-panel-left {
          grid-column: span 7 / span 7;
          border-right: 2px solid #041632;
        }
        .tracking-panel-right {
          grid-column: span 5 / span 5;
        }

        @media (max-width: 1024px) {
          .tracking-main-grid { display: flex; flex-direction: column; }
          .tracking-panel-left { border-right: none; border-bottom: 2px solid #041632; }
          .tracking-panel-right { min-height: 400px; }
        }

        @media (max-width: 768px) {
          .responsive-header { flex-direction: column; align-items: flex-start; }
          .refresh-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* HEADER */}
      <header className="responsive-header" style={{ borderBottom: '2px solid #041632', padding: '16px 24px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} style={{ border: '2px solid #041632', backgroundColor: 'transparent', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
          <span style={{ cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.05em' }} onClick={() => navigate('/')}>tel-co</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', border: '2px solid #041632', padding: '4px 8px', backgroundColor: '#fed3c7', fontWeight: '700' }}>
            ASENKRON TAKİP TERMİNALİ
          </span>
        </div>
        
        <button onClick={fetchOrderHistory} disabled={!user} className="refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid #041632', backgroundColor: user ? '#ffffff' : '#ccc', padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '700', cursor: user ? 'pointer' : 'not-allowed', boxShadow: user ? '2px 2px 0px 0px #041632' : 'none' }}>
          <RefreshCw style={{ width: '14px', height: '14px' }} className={loading ? 'animate-spin' : ''} />
          VERİYİ TAZELE
        </button>
      </header>

      {/* WORKSPACE */}
      <main className="tracking-main-grid">
        
        {/* ZAMAN TÜNELİ (SOL PANEL) */}
        <section className="tracking-panel-left" style={{ padding: '32px', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          <div>
            <div style={{ display: 'flex', justifyWith: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '2px dashed #041632', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#666', display: 'block' }}>TAKİP NUMARASI</span>
                <h1 style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>#{orderId}</h1>
              </div>
            </div>

            {/* 🛑 GİZLİLİK KORUMASI: Giriş yapmamış adama kilit ekranı gösteriyoruz kanka */}
            {!user ? (
              <div style={{ border: '2px dashed #041632', backgroundColor: '#fbf9f8', padding: '40px 24px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', marginTop: '20px', boxShadow: '4px 4px 0px 0px #041632' }}>
                <Lock style={{ width: '40px', height: '40px', margin: '0 auto 16px auto', color: '#041632' }} />
                <h2 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: '#041632' }}>GÜVENLİ VE GİZLİ VERİ ALANI</h2>
                <p style={{ fontSize: '11px', color: '#555', marginBottom: '20px', lineHeight: '1.5' }}>
                  Bu sipariş kişisel abone verileri içermektedir.<br />Tarihçe ve canlı akışı izleyebilmek için lütfen giriş yapınız.
                </p>
                <button
                  onClick={() => {
                    // Kullanıcı giriş yaptıktan sonra tam olarak bu sipariş ID'sine geri dönsün kanka:
                    setRedirectTo(`/track/${orderId}`);
                    navigate('/auth');
                  }}
                  style={{ backgroundColor: '#041632', color: '#ffffff', border: '2px solid #041632', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', boxShadow: '2px 2px 0px 0px #041632' }}
                >
                  OTURUM AÇ / KAYIT OL
                </button>
              </div>
            ) : (
              /* ✅ GİRİŞ YAPILDIYSA ASIL ZAMAN TÜNELİ AKIŞI GÖRÜNÜR */
              <>
                {error && (
                  <div style={{ border: '2px solid red', padding: '12px', backgroundColor: '#ffe6e6', color: 'red', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 'bold', marginBottom: '24px' }}>
                    <AlertTriangle style={{ display: 'inline', width: '16px', height: '16px', marginRight: '8px' }} />
                    SİPARİŞ GEÇMİŞİ BULUNAMADI VEYA BU SİPARİŞ SİZE AİT DEĞİL.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '8px', position: 'relative', marginBottom: '32px' }}>
                  {history.length > 0 && <div style={{ position: 'absolute', top: '12px', bottom: '12px', left: '19px', width: '2px', backgroundColor: '#041632', borderStyle: 'dashed' }}></div>}

                  {history.length === 0 && !loading && !error && (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#666' }}>Henüz log kaydı oluşmadı...</div>
                  )}

                  {history.map((logItem, index) => {
                    const isCurrent = index === history.length - 1; 
                    const isSuccess = logItem.status === 'ONAYLANDI';
                    
                    return (
                      <div key={logItem.id || index} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
                        <div style={{ width: '24px', height: '24px', flexShrink: 0, borderRadius: '50%', border: '2px solid #041632', backgroundColor: isSuccess ? '#006400' : (!isCurrent ? '#041632' : '#fed3c7'), display: 'flex', alignItems: 'center', justifyWith: 'center', display: 'flex', justifyContent: 'center' }}>
                          {!isCurrent || isSuccess ? (
                            <CheckCircle2 style={{ width: '14px', height: '14px', color: '#ffffff' }} />
                          ) : (
                            <Clock style={{ width: '14px', height: '14px', color: '#041632' }} className="animate-pulse" />
                          )}
                        </div>

                        <div style={{ flex: 1, border: '2px solid #041632', padding: '12px 16px', backgroundColor: isSuccess ? '#e6ffe6' : (isCurrent ? '#ffffff' : '#fbf9f8'), boxShadow: isCurrent ? '3px 3px 0px 0px #041632' : 'none' }}>
                          <div style={{ display: 'flex', justifyWith: 'space-between', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                            <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '800', margin: 0, color: isSuccess ? '#006400' : '#041632' }}>{logItem.status || 'SİSTEM İŞLEMİ'}</h3>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#666' }}>
                              {logItem.changedAt ? new Date(logItem.changedAt).toLocaleTimeString() : '--:--'}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#444', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                            {logItem.description || 'Sipariş statüsü güncellendi.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* TERMİNAL LOGLARI (SAĞ PANEL) */}
        <section className="tracking-panel-right" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#041632' }}>
          <div style={{ flex: 1, color: '#fbf9f8', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(251, 249, 248, 0.2)', paddingBottom: '8px' }}>
              <Terminal style={{ width: '16px', height: '16px', color: '#fed3c7' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>BACKEND DB EVENT STREAM</span>
            </div>

            <div style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
              {!user ? (
                <div style={{ color: 'rgba(251, 249, 248, 0.4)', fontStyle: 'italic' }}>
                  [SECURE LOCK] STREAM IS ENCRYPTED. PLEASE LOGIN TO START EVENT RECEIVER...
                </div>
              ) : (
                <>
                  {history.map((logItem, index) => (
                    <div key={index} style={{ color: logItem.status === 'ONAYLANDI' ? '#4ade80' : (logItem.status?.includes('ERROR') ? 'red' : '#b7c7eb'), wordBreak: 'break-word' }}>
                      [{logItem.changedAt ? new Date(logItem.changedAt).toLocaleTimeString() : 'TIME'}] [DB] STATUS: {logItem.status} - {logItem.description}
                    </div>
                  ))}
                  
                  {history.length > 0 && history[history.length - 1].status !== 'ONAYLANDI' && (
                    <div style={{ color: '#fed3c7' }} className="animate-pulse mt-2">
                      <RefreshCw style={{ display: 'inline', width: '10px', height: '10px', marginRight: '6px' }} className="animate-spin" />
                      RABBITMQ KUYRUĞU DİNLENİYOR...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}