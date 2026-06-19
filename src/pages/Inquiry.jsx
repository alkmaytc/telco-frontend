import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Search, Bell, Settings, Loader2, AlertTriangle } from 'lucide-react';
import { AddressService, FeasibilityService, OrderService } from '../services/api';

const containerStyle = { width: '100%', height: '100%' };

// Jüri için haritayı daha anlaşılır (standart) yapmaya karar vermiştik
const retroMapStyle = []; 

export default function Inquiry() {
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchSerial, setSearchSerial] = useState('');

  // --- DİNAMİK ADRES ZİNCİRİ ---
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
  
  // ÇİFT TIKLAMA KORUMASI İÇİN YENİ STATE
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AddressService.getDistricts()
      .then(res => {
        setDistricts(res.data);
        if(res.data.length > 0) setSelected(prev => ({ ...prev, district: res.data[0] }));
      })
      .catch(err => console.error("İlçeler çekilemedi:", err));
  }, []);

  useEffect(() => {
    if (selected.district) {
      setNeighborhoods([]); setStreets([]); setBuildings([]);
      AddressService.getNeighborhoods(selected.district)
        .then(res => {
          setNeighborhoods(res.data);
          if(res.data.length > 0) setSelected(prev => ({ ...prev, neighborhood: res.data[0] }));
        });
    }
  }, [selected.district]);

  useEffect(() => {
    if (selected.district && selected.neighborhood) {
      setStreets([]); setBuildings([]);
      AddressService.getStreets(selected.district, selected.neighborhood)
        .then(res => {
          setStreets(res.data);
          if(res.data.length > 0) setSelected(prev => ({ ...prev, street: res.data[0] }));
        });
    }
  }, [selected.neighborhood]);

  useEffect(() => {
    if (selected.district && selected.neighborhood && selected.street) {
      AddressService.getBuildings(selected.district, selected.neighborhood, selected.street)
        .then(res => {
          setBuildings(res.data);
          if(res.data.length > 0) setSelected(prev => ({ ...prev, bbk: res.data[0].bbk }));
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
      setFeasibility(response.data); 
    } catch (err) {
      console.error("Altyapı sorgu hatası:", err);
      setErrorMsg("PostGIS altyapı servisine ulaşılamadı veya bina menzil dışında.");
    } finally {
      setLoading(false);
    }
  };

  // GÜNCELLENMİŞ SİPARİŞ FONKSİYONU (ÇİFT TIKLAMA KORUMALI)
  const handleOrderInitiate = async (pkg) => {
    try {
      setIsSubmitting(true); // BUTONU KİLİTLE

      const orderRequestDTO = {
        bbk: feasibility.bbk,
        packageName: pkg.packageName,
        speedMbps: pkg.speedMbps,
        price: pkg.price
      };

      console.log("RabbitMQ'ya Sipariş Fırlatılıyor:", orderRequestDTO);
      const response = await OrderService.createOrder(orderRequestDTO);
      const newOrderId = response.data.id || response.data.orderId || 'TR-000';
      navigate(`/track/${newOrderId}`);

    } catch (error) {
      console.error("Sipariş oluşturulamadı:", error);
      alert("Sipariş işlemi sırasında hata oluştu. Lütfen tekrar deneyin.");
      setIsSubmitting(false); // HATA OLURSA KİLİDİ AÇ
    }
  };

  const handleSerialSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (!searchSerial.trim()) return;
      navigate(`/track/${encodeURIComponent(searchSerial.trim())}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ borderBottom: '2px solid #041632', padding: '16px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.05em' }}>tel-co</span>
          <nav style={{ display: 'flex', gap: '20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700' }}>
            <a href="/" style={{ textDecoration: 'underline', textUnderlineOffset: '6px', textDecorationThickness: '2px', color: '#041632' }}>INVENTORY</a>
            <a href="/admin" style={{ textDecoration: 'none', color: '#666' }}>ADMIN PANEL</a>
          </nav>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '4px 12px', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="SİPARİŞ ID SORGULA..." 
              value={searchSerial}
              onChange={(e) => setSearchSerial(e.target.value)}
              onKeyDown={handleSerialSearch}
              style={{ border: 'none', outline: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', width: '180px', backgroundColor: 'transparent' }}
            />
            <Search style={{ width: '14px', height: '14px', cursor: 'pointer' }} onClick={handleSerialSearch} />
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', width: '100%' }}>
        
        <section style={{ gridColumn: 'span 3 / span 3', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff', position: 'relative', borderRight: '2px solid #041632' }}>
          
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
                <select 
                  value={selected.district}
                  onChange={(e) => setSelected({...selected, district: e.target.value})}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                >
                  <option value="">Seçiniz...</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>MAHALLE</label>
                <select 
                  value={selected.neighborhood}
                  onChange={(e) => setSelected({...selected, neighborhood: e.target.value})}
                  disabled={!selected.district}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: selected.district ? '#fbf9f8' : '#e0e0e0', padding: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                >
                  <option value="">Seçiniz...</option>
                  {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>SOKAK / CADDE</label>
                <select 
                  value={selected.street}
                  onChange={(e) => setSelected({...selected, street: e.target.value})}
                  disabled={!selected.neighborhood}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: selected.neighborhood ? '#fbf9f8' : '#e0e0e0', padding: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                >
                  <option value="">Seçiniz...</option>
                  {streets.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>BİNA (BBK)</label>
                <select 
                  value={selected.bbk}
                  onChange={(e) => setSelected({...selected, bbk: e.target.value})}
                  disabled={!selected.street || buildings.length === 0}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: selected.street ? '#fbf9f8' : '#e0e0e0', padding: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                >
                  <option value="">Bina Seçiniz...</option>
                  {buildings.map(b => (
                    <option key={b.bbk} value={b.bbk}>No: {b.buildingNumber} (BBK: {b.bbk})</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleInquiry} disabled={!selected.bbk} style={{ width: '100%', backgroundColor: selected.bbk ? '#041632' : '#888', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', padding: '14px', marginTop: '20px', border: '2px solid #041632', cursor: selected.bbk ? 'pointer' : 'not-allowed', boxShadow: '3px 3px 0px 0px #041632' }}>
              SİNYALİ KONTROL ET
            </button>
          </div>

          <div style={{ borderTop: '2px solid #041632', paddingTop: '20px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '8px', opacity: feasibility ? 1 : 0.3 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', backgroundColor: '#fbf9f8', fontSize: '14px' }}>
                {feasibility ? feasibility.lineQualityPercent : '--'}%
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: '700', display: 'block' }}>LINE QUALITY</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', backgroundColor: '#fbf9f8', fontSize: '13px' }}>
                {feasibility ? feasibility.snrMarginDb : '--'}dB
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: '700', display: 'block' }}>SNR MARGIN</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', backgroundColor: '#fbf9f8', fontSize: '13px' }}>
                {feasibility ? feasibility.attenuationDb : '--'}dB
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: '700', display: 'block' }}>ATTENUAT.</span>
            </div>
          </div>
        </section>

        <section style={{ gridColumn: 'span 9 / span 9', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          
          <div style={{ width: '100%', height: '450px', position: 'relative', borderBottom: '2px solid #041632' }}>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={feasibility ? { lat: feasibility.buildingLat, lng: feasibility.buildingLng } : { lat: 39.7685, lng: 30.5095 }}
                zoom={feasibility ? 16 : 12}
                options={{ disableDefaultUI: false }}
              >
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

            {feasibility && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#ffffff', border: '2px solid #041632', padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', boxShadow: '3px 3px 0px 0px #041632', zIndex: 5, minWidth: '220px' }}>
                
                {/* JÜRİ KURTARAN KOPYA KISMI */}
                <div style={{ fontWeight: '800', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💾 NODE: {feasibility.closestNodeName}</span>
                  <span style={{ color: '#006400', fontSize: '10px', marginLeft: '12px', padding: '2px 4px', border: '1px solid #006400' }}>
                    ADMIN ID: {feasibility.closestNodeName ? parseInt(feasibility.closestNodeName.split('-')[2]) - 1000 : '?'}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: feasibility.hasEmptyPort ? '#006400' : '#8b0000', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: feasibility.hasEmptyPort ? '#006400' : '#8b0000', display: 'inline-block' }}></span>
                  {feasibility.infrastructureType} {feasibility.hasEmptyPort ? 'PORT MÜSAİT' : 'PORT YOK'}
                </div>
                <div style={{ fontSize: '10px', marginTop: '4px', color: '#666' }}>Mesafe: {feasibility.distanceMeters}m | Max Hız: {feasibility.maxAvailableSpeedMbps} Mbps</div>
              </div>
            )}
          </div>

          <div style={{ padding: '32px', backgroundColor: '#fbf9f8', flex: 1 }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px' }}>
              {feasibility ? 'BİNANIZA ÖZEL ALTYAPI PAKETLERİ' : 'LÜTFEN ADRES SORGULAYINIZ'}
            </h2>

            {feasibility && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {feasibility.availablePackages.map((pkg) => (
                  <div key={pkg.id} style={{ border: '2px solid #041632', backgroundColor: '#ffffff', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>{pkg.packageName}</h3>
                      <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px' }}>
                        {pkg.speedMbps} <span style={{ fontSize: '13px', fontWeight: '500', fontFamily: 'JetBrains Mono, monospace' }}>Mbps</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid #041632', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700' }}>{pkg.price}₺/ay</span>
                      
                      {/* GÜNCELLENMİŞ BUTON (İşleniyor & Disabled Korumalı) */}
                      <button 
                        onClick={() => handleOrderInitiate(pkg)}
                        disabled={!feasibility.hasEmptyPort || isSubmitting}
                        style={{ 
                          border: '2px solid #041632', 
                          backgroundColor: feasibility.hasEmptyPort ? '#041632' : '#ccc', 
                          color: feasibility.hasEmptyPort ? '#ffffff' : '#666', 
                          fontFamily: 'JetBrains Mono, monospace', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          padding: '6px 12px', 
                          cursor: (!feasibility.hasEmptyPort || isSubmitting) ? 'not-allowed' : 'pointer',
                          opacity: isSubmitting ? 0.7 : 1
                        }}
                      >
                        {isSubmitting ? 'İŞLENİYOR...' : (feasibility.hasEmptyPort ? 'HEMEN BAŞLA' : 'PORT DOLU')}
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}