import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Search, Loader2, AlertTriangle, ListOrdered, ChevronRight } from 'lucide-react';
import { AddressService, FeasibilityService, OrderService } from '../services/api';
import { AuthContext } from '../context/AuthContext'; 

const containerStyle = { width: '100%', height: '100%' };

export default function Inquiry() {
  const navigate = useNavigate();
  const { user, logout, setRedirectTo } = useContext(AuthContext); 
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchSerial, setSearchSerial] = useState('');

  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [streets, setStreets] = useState([]);
  const [buildings, setBuildings] = useState([]); 

  const [selected, setSelected] = useState({
    district: '',
    neighborhood: '',
    street: '',
    bbk: '' 
  });

  const [feasibility, setFeasibility] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [myOrders, setMyOrders] = useState([]);

  // 🎯 POP-UP KONTROL STATE'LERİ
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState(null);

  // 🎯 AKILLI HAFIZA KONTROLÜ
  useEffect(() => {
    const savedBbk = localStorage.getItem('temp_bbk');
    const pendingPkgName = localStorage.getItem('pending_pkg_name');

    if (savedBbk && !feasibility) {
      setLoading(true);
      FeasibilityService.checkByBbk(savedBbk)
        .then(response => {
          setFeasibility(response);
          setSelected(prev => ({ ...prev, bbk: savedBbk }));
          localStorage.removeItem('temp_bbk'); 

          if (pendingPkgName && user) {
            const matchedPkg = response.availablePackages?.find(p => p.packageName === pendingPkgName);
            if (matchedPkg) {
              localStorage.removeItem('pending_pkg_name');
              autoSubmitOrder(savedBbk, matchedPkg);
            }
          }
        })
        .catch(err => console.error("Hafızadaki akış kurtarılamadı:", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  // 🎯 SİPARİŞ GEÇMİŞİNİ BACKEND'DEN ÇEKME
  useEffect(() => {
    if (user) {
      OrderService.getMyOrders()
        .then(res => {
          setMyOrders(res || []);
        })
        .catch(err => console.error("Kullanıcı sipariş geçmişi çekilemedi:", err));
    } else {
      setMyOrders([]);
    }
  }, [user]);

  // Adres Hiyerarşisi Adımları
  useEffect(() => {
    AddressService.getDistricts()
      .then(res => {
        setDistricts(res);
        if(res.length > 0) setSelected(prev => ({ ...prev, district: res[0] }));
      })
      .catch(err => console.error("İlçeler çekilemedi:", err));
  }, []);

  useEffect(() => {
    if (selected.district) {
      setNeighborhoods([]); setStreets([]); setBuildings([]);
      AddressService.getNeighborhoods(selected.district)
        .then(res => {
          setNeighborhoods(res);
          if(res.length > 0) setSelected(prev => ({ ...prev, neighborhood: res[0] }));
        });
    }
  }, [selected.district]);

  useEffect(() => {
    if (selected.district && selected.neighborhood) {
      setStreets([]); setBuildings([]);
      AddressService.getStreets(selected.district, selected.neighborhood)
        .then(res => {
          setStreets(res);
          if(res.length > 0) setSelected(prev => ({ ...prev, street: res[0] }));
        });
    }
  }, [selected.neighborhood]);

  useEffect(() => {
    if (selected.district && selected.neighborhood && selected.street) {
      AddressService.getBuildings(selected.district, selected.neighborhood, selected.street)
        .then(res => {
          setBuildings(res);
          if(res.length > 0) setSelected(prev => ({ ...prev, bbk: res[0].bbk }));
        });
    }
  }, [selected.street]);

  const handleInquiry = async (e) => {
    e.preventDefault();
    if (!selected.bbk) {
      setErrorMsg("Lütfen geçerli bir bina (BBK) seçiniz.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await FeasibilityService.checkByBbk(selected.bbk);
      setFeasibility(response); 
    } catch (err) {
      console.error("Altyapı sorgu hatası:", err);
      setErrorMsg(err.message || "PostGIS altyapı servisine ulaşılamadı veya bina menzil dışında.");
    } finally {
      setLoading(false);
    }
  };

  const autoSubmitOrder = async (bbkId, pkg) => {
    try {
      setIsSubmitting(true);
      const orderRequestDTO = {
        bbk: bbkId,
        packageName: pkg.packageName,
        speedMbps: pkg.speedMbps,
        price: pkg.price
      };
      const response = await OrderService.createOrder(orderRequestDTO);
      const newOrderId = response.id || 'TR-000';
      navigate(`/track/${newOrderId}`);
    } catch (error) {
      console.error("Otomatik sipariş basılamadı:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderInitiate = async (pkg) => {
    if (!user) {
      setPendingPackage(pkg);
      setShowAuthModal(true);
      return;
    }

    try {
      setIsSubmitting(true); 

      const orderRequestDTO = {
        bbk: feasibility.bbk,
        packageName: pkg.packageName,
        speedMbps: pkg.speedMbps,
        price: pkg.price
      };

      const response = await OrderService.createOrder(orderRequestDTO);
      const newOrderId = response.id || 'TR-000';
      navigate(`/track/${newOrderId}`);

    } catch (error) {
      console.error("Sipariş oluşturulamadı:", error);
      alert(error.message || "Sipariş işlemi sırasında hata oluştu.");
      setIsSubmitting(false); 
    }
  };

  const handleModalProceed = () => {
    if (pendingPackage && feasibility) {
      localStorage.setItem('temp_bbk', feasibility.bbk);
      localStorage.setItem('pending_pkg_name', pendingPackage.packageName);
      if (feasibility.buildingLat) {
        localStorage.setItem('selected_lat', feasibility.buildingLat);
        localStorage.setItem('selected_lng', feasibility.buildingLng);
      }
    }
    setRedirectTo('/');
    navigate('/auth');
  };

  const handleSerialSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (!searchSerial.trim()) return;
      navigate(`/track/${encodeURIComponent(searchSerial.trim())}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      <style>{`
        .responsive-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
        .main-layout { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); width: 100%; flex: 1; }
        .left-panel { grid-column: span 3 / span 3; border-right: 2px solid #041632; }
        .right-panel { grid-column: span 9 / span 9; }
        .map-container { height: 450px; }
        .my-orders-list { overflow-y: auto; max-height: 200px; display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .order-history-item { border: 2px solid #041632; padding: 10px; display: flex; justify-content: space-between; align-items: center; background-color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 11px; cursor: pointer; transition: transform 0.1s ease; }
        .order-history-item:hover { transform: translate(-2px, -2px); box-shadow: 2px 2px 0px 0px #041632; }
        @media (max-width: 1024px) { .left-panel { grid-column: span 4 / span 4; } .right-panel { grid-column: span 8 / span 8; } }
        @media (max-width: 768px) { .responsive-header { flex-direction: column; align-items: flex-start; } .search-bar-container { width: 100%; display: flex; } .search-bar-container input { flex: 1; } .main-layout { display: flex; flex-direction: column; } .left-panel { border-right: none; border-bottom: 2px solid #041632; } .map-container { height: 300px; } }
      `}</style>

      {/* HEADER */}
      <header className="responsive-header" style={{ borderBottom: '2px solid #041632', padding: '16px 24px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span style={{ cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.05em' }} onClick={() => navigate('/')}>tel-co</span>
          <nav style={{ display: 'flex', gap: '20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700' }}>
            <Link to="/" style={{ textDecoration: 'underline', textUnderlineOffset: '6px', textDecorationThickness: '2px', color: '#041632' }}>INVENTORY</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" style={{ textDecoration: 'none', color: '#041632', fontWeight: '900' }}>ADMIN PANEL 🔧</Link>
            )}
          </nav>
        </div>
        
        {/* KULLANICI ALANI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '700' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#041632', borderBottom: '1px dashed #041632' }}>👤 {user.fullName.toUpperCase()}</span>
                <span style={{ color: '#ccc' }}>|</span>
                <button onClick={() => { logout(); navigate('/'); }} style={{ border: 'none', backgroundColor: 'transparent', color: '#ff3333', cursor: 'pointer', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', padding: 0 }}>ÇIKIŞ YAP</button>
              </div>
            ) : (
              <Link to="/auth" style={{ color: '#041632', textDecoration: 'none', borderBottom: '2px solid #041632', paddingBottom: '2px' }}>GİRİŞ YAP / KAYIT OL</Link>
            )}
          </div>

          {/* SİPARİŞ TAKİP SORGULAMA KUTUSU */}
          {user && (
            <div className="search-bar-container" style={{ border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
              <input type="text" placeholder="SİPARİŞ ID SORGULA..." value={searchSerial} onChange={(e) => setSearchSerial(e.target.value)} onKeyDown={handleSerialSearch} style={{ border: 'none', outline: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', width: '180px', backgroundColor: 'transparent' }} />
              <Search style={{ width: '16px', height: '16px', cursor: 'pointer' }} onClick={handleSerialSearch} />
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-layout">
        
        {/* SOL ADRES PANELİ */}
        <section className="left-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(251, 249, 248, 0.85)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700' }}>
              <Loader2 className="animate-spin mb-2" style={{ color: '#041632', width: '32px', height: '32px' }} />
              CBS VERİLERİ İŞLENİYOR...
            </div>
          )}

          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', lineHeight: '1.1' }}>ALTYAPI SORGULAMA</h1>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '24px' }}>Hizmet bölgesindeki sinyal gücünü hesaplamak için adres hiyerarşisini seçiniz.</p>

            {errorMsg && (
              <div style={{ border: '2px solid red', padding: '8px', marginBottom: '16px', fontSize: '11px', color: 'red', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace' }}>
                <AlertTriangle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>İLÇE</label>
                <select value={selected.district} onChange={(e) => setSelected({...selected, district: e.target.value})} style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}><option value="">Seçiniz...</option>{districts.map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>MAHALLE</label>
                <select value={selected.neighborhood} onChange={(e) => setSelected({...selected, neighborhood: e.target.value})} disabled={!selected.district} style={{ width: '100%', border: '2px solid #041632', backgroundColor: selected.district ? '#fbf9f8' : '#e0e0e0', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}><option value="">Seçiniz...</option>{neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}</select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>SOKAK / CADDE</label>
                <select value={selected.street} onChange={(e) => setSelected({...selected, street: e.target.value})} disabled={!selected.neighborhood} style={{ width: '100%', border: '2px solid #041632', backgroundColor: selected.neighborhood ? '#fbf9f8' : '#e0e0e0', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}><option value="">Seçiniz...</option>{streets.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>BİNA (BBK)</label>
                <select value={selected.bbk} onChange={(e) => setSelected({...selected, bbk: e.target.value})} disabled={!selected.street || buildings.length === 0} style={{ width: '100%', border: '2px solid #041632', backgroundColor: selected.street ? '#fbf9f8' : '#e0e0e0', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}><option value="">Bina Seçiniz...</option>{buildings.map(b => <option key={b.bbk} value={b.bbk}>No: {b.buildingNumber} (BBK: {b.bbk})</option>)}</select>
              </div>
            </div>

            <button onClick={handleInquiry} disabled={!selected.bbk} style={{ width: '100%', backgroundColor: selected.bbk ? '#041632' : '#888', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', padding: '14px', marginTop: '20px', border: '2px solid #041632', cursor: selected.bbk ? 'pointer' : 'not-allowed', boxShadow: '3px 3px 0px 0px #041632' }}>SİNYALİ KONTROL ET</button>
          </div>

          {/* KULLANICININ KENDİ BAŞVURULARI */}
          {user && myOrders.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px solid #041632' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <ListOrdered style={{ width: '14px', height: '14px' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '900' }}>BAŞVURULARIM ({myOrders.length})</span>
              </div>
              <div className="my-orders-list">
                {myOrders.map(order => (
                  <div key={order.id} onClick={() => navigate(`/track/${order.id}`)} className="order-history-item">
                    <div>
                      <span style={{ fontWeight: '800' }}>#{order.id}</span>
                      <span style={{ color: '#666', marginLeft: '6px' }}>{order.packageName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: order.status === 'ONAYLANDI' ? 'green' : '#ff8c00', fontWeight: 'bold' }}>
                        {order.status}
                      </span>
                      <ChevronRight style={{ width: '12px', height: '12px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GAUGES */}
          <div style={{ borderTop: '2px solid #041632', paddingTop: '20px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '8px', opacity: feasibility ? 1 : 0.3 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', backgroundColor: '#fbf9f8', fontSize: '13px' }}>{feasibility ? feasibility.lineQualityPercent : '--'}%</div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: '700', display: 'block' }}>LINE QUALITY</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', backgroundColor: '#fbf9f8', fontSize: '12px' }}>{feasibility ? feasibility.snrMarginDb : '--'}dB</div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: '700', display: 'block' }}>SNR MARGIN</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', backgroundColor: '#fbf9f8', fontSize: '12px' }}>{feasibility ? feasibility.attenuationDb : '--'}dB</div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: '700', display: 'block' }}>ATTENUAT.</span>
            </div>
          </div>
        </section>

        {/* SAĞ PANEL (HARİTA & PAKETLER) */}
        <section className="right-panel" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          <div className="map-container" style={{ position: 'relative', borderBottom: '2px solid #041632' }}>
            {isLoaded ? (
              <GoogleMap mapContainerStyle={containerStyle} center={feasibility ? { lat: feasibility.buildingLat, lng: feasibility.buildingLng } : { lat: 39.7685, lng: 30.5095 }} zoom={feasibility ? 16 : 12} options={{ disableDefaultUI: false }}>
                {feasibility && (
                  <>
                    <MarkerF position={{ lat: feasibility.buildingLat, lng: feasibility.buildingLng }} label="EV" />
                    <MarkerF position={{ lat: feasibility.closestNodeLat, lng: feasibility.closestNodeLng }} icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} />
                  </>
                )}
              </GoogleMap>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace' }}>HARİTA YÜKLENİYOR...</div>
            )}

            {/* HARİTA ÜSTÜ ALTYAPI BİLGİ KUTUSU */}
            {feasibility && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#ffffff', border: '2px solid #041632', padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', boxShadow: '3px 3px 0px 0px #041632', zIndex: 5, minWidth: '220px', maxWidth: 'calc(100% - 32px)' }}>
                {user?.role === 'ADMIN' ? (
                  <>
                    <div style={{ fontWeight: '800', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>💾 NODE: {feasibility.closestNodeName}</span>
                      <span style={{ color: '#006400', fontSize: '10px', padding: '2px 4px', border: '1px solid #006400', marginTop: '4px' }}>
                        ADMIN ID: {feasibility.closestNodeName ? parseInt(feasibility.closestNodeName.split('-')[2]) - 1000 : '?'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: feasibility.hasEmptyPort ? '#006400' : '#8b0000', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: feasibility.hasEmptyPort ? '#006400' : '#8b0000', display: 'inline-block' }}></span>
                      {feasibility.infrastructureType} {feasibility.hasEmptyPort ? 'PORT MÜSAİT' : 'PORT DOLU'}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: '800', marginBottom: '6px', fontSize: '13px', color: '#041632' }}>🌐 ALTYAPI DURUMU</div>
                    <div style={{ fontSize: '11px', color: feasibility.hasEmptyPort ? '#006400' : '#8b0000', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: feasibility.hasEmptyPort ? '#006400' : '#8b0000', display: 'inline-block' }}></span>
                      {feasibility.infrastructureType === 'FIBER' ? '💥 YÜKSEK HIZLI FİBER' : '📶 HIZLI VDSL'} - {feasibility.hasEmptyPort ? 'BAŞVURUYA UYGUN' : 'PORT BEKLEME LİSTESİ'}
                    </div>
                  </>
                )}
                <div style={{ fontSize: '10px', marginTop: '4px', color: '#666', borderTop: '1px dashed #eae8e7', paddingTop: '4px' }}>Mesafe: {feasibility.distanceMeters}m | Max Hız: {feasibility.maxAvailableSpeedMbps} Mbps</div>
              </div>
            )}
          </div>

          {/* DİNAMİK PAKET LİSTELEME ALANI */}
          <div style={{ padding: '32px', backgroundColor: '#fbf9f8', flex: 1 }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px' }}>{feasibility ? 'BİNANIZA ÖZEL ALTYAPI PAKETLERİ' : 'LÜTFEN ADRES SORGULAYINIZ'}</h2>
            {feasibility && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {feasibility.availablePackages?.map((pkg) => (
                  <div key={pkg.id || pkg.packageName} style={{ border: '2px solid #041632', backgroundColor: '#ffffff', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>{pkg.packageName}</h3>
                      <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px' }}>{pkg.speedMbps} <span style={{ fontSize: '13px', fontWeight: '500', fontFamily: 'JetBrains Mono, monospace' }}>Mbps</span></div>
                    </div>
                    <div style={{ borderTop: '1px solid #041632', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700' }}>{pkg.price}₺/ay</span>
                      <button onClick={() => handleOrderInitiate(pkg)} disabled={isSubmitting} style={{ border: '2px solid #041632', backgroundColor: '#041632', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', padding: '8px 12px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>{isSubmitting ? 'İŞLENİYOR...' : 'HEMEN BAŞLA'}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 🛡️ %100 SİMETRİK VE ORTALANMIŞ MÜHÜRLÜ GİRİŞ MODALI ✅ */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4, 22, 50, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '3px solid #041632', padding: '32px', maxWidth: '440px', width: '90%', boxShadow: '6px 6px 0px 0px #041632', position: 'relative', textAlign: 'center' }}>
            
            {/* Başlık ve İkon - Tamamen Ortalandı */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#fff3cd', border: '2px solid #041632', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ color: '#041632', width: '20px', height: '20px' }} />
              </div>
              <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>GİRİŞ YAPMANIZ GEREKLİ</h3>
            </div>

            {/* Sade ve Ortalanmış Metin */}
            <p style={{ fontSize: '13px', color: '#444', lineHeight: '1.6', marginBottom: '24px', textAlign: 'center' }}>
              Seçtiğiniz <strong>{pendingPackage?.packageName}</strong> paketine başvuru yapabilmek ve işlemlere devam edebilmek için lütfen önce giriş yapın.
            </p>

            {/* Butonlar - Tam Ortada ve Hizalı */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '700' }}>
              <button 
                onClick={() => { setShowAuthModal(false); setPendingPackage(null); }}
                style={{ border: '2px solid #041632', backgroundColor: '#ffffff', color: '#041632', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', transition: 'transform 0.1s ease' }}
              >
                İPTAL
              </button>
              <button 
                onClick={handleModalProceed}
                style={{ border: '2px solid #041632', backgroundColor: '#041632', color: '#ffffff', padding: '10px 20px', cursor: 'pointer', fontWeight: '700', boxShadow: '3px 3px 0px 0px #041632' }}
              >
                GİRİŞ SAYFASINA GİT 
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}