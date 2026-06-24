import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ShieldCheck, Save, AlertTriangle } from 'lucide-react';
import { UserService } from '../services/api';
import { AuthContext } from '../context/AuthContext'; // 🎯 Ortak havuz bağlandı

export default function UserProfile() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // 🎯 Canlı state'i yakaladık
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [alert, setAlert] = useState({ type: '', msg: '' });
  
  // Profil Form State'leri
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    identityNumber: '' // Salt-okunur (Read-only) alan kanka
  });

  const triggerAlert = (msg, type) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert({ type: '', msg: '' }), 4000);
  };

  // 📥 BACKEND'DEN GİRİŞ YAPMIŞ KULLANICININ VERİLERİNİ ÇEKME
  const fetchProfile = async () => {
    try {
      setInitialLoading(true);
      const data = await UserService.getMyProfile();
      if (data) {
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          identityNumber: data.identityNumber || ''
        });
      }
    } catch (err) {
      console.error("Profil bilgileri yüklenemedi:", err);
      triggerAlert(err.message || "Profil verileri çekilemedi. Oturumu kontrol edin!", "error");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 💾 PROFİL GÜNCELLEME MOTORU (MUTATION) - STATE DESYNCHRONIZATION TAM ÇÖZÜMÜ ✅
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      triggerAlert("Lütfen zorunlu alanları boş bırakmayın!", "error");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Backend veritabanını güncelliyoruz kanka
      await UserService.updateMyProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });

      // 2. 🎯 AUTHCONTEXT & LOCALSTORAGE SENKRONİZASYONU:
      // Değişen yeni ismi AuthContext'in beklediği 'telco_fullName' alanına kalıcı olarak mühürlüyoruz
      const currentName = `${formData.firstName} ${formData.lastName}`;
      localStorage.setItem('telco_fullName', currentName);

      // 3. Canlı state'i de doğrudan besliyoruz ki saniyede güncellensin!
      if (user) {
        user.fullName = currentName;
      }

      triggerAlert("Profil bilgileriniz başarıyla güncellendi! ⚡", "success");
      
      // 4. Kullanıcıyı anasayfaya sarsıntısız şekilde fırlatıp hafızayı tazeliyoruz kanka
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (err) {
      console.error("Profil güncelleme hatası:", err);
      triggerAlert(err.message || "Profil güncellenirken altyapı hatası oluştu!", "error");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 'bold' }}>
        🔄 KORUMALI PROFİL VERİLERİ ÇEKİLİYOR...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', flexDirection: 'column', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      {/* HEADER / BRUTALIST NAVBAR */}
      <header style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #041632', padding: '16px 24px', backgroundColor: '#ffffff', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ border: '2px solid #041632', backgroundColor: 'transparent', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
        </button>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.05em', cursor: 'pointer' }} onClick={() => navigate('/')}>tel-co</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', border: '2px solid #041632', padding: '4px 8px', backgroundColor: '#fff3cd', fontWeight: '700' }}>
          MÜŞTERİ HESAP AYARLARI 👤
        </span>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        
        <div style={{ width: '100%', maxWidth: '460px', backgroundColor: '#ffffff', border: '2px solid #041632', padding: '32px', boxShadow: '6px 6px 0px 0px #041632' }}>
          
          <h2 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={22} /> KİŞİSEL BİLGİLERİM
          </h2>
          <p style={{ fontSize: '12px', color: '#555', fontFamily: 'JetBrains Mono, monospace', marginBottom: '24px' }}>
            BSS Çekirdek şebekesindeki üyelik kartınız.
          </p>

          {alert.msg && (
            <div style={{ 
              border: `2px solid #041632`, 
              backgroundColor: alert.type === 'success' ? '#e6ffe6' : '#fed3c7', 
              padding: '12px', 
              marginBottom: '20px', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              fontFamily: 'JetBrains Mono, monospace',
              boxShadow: '2px 2px 0px 0px #041632'
            }}>
              <AlertTriangle style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {alert.type === 'success' ? '✅ SUCCESS: ' : '❌ ERROR: '} {alert.msg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* T.C. Kimlik (Salt Okunur / Değiştirilemez) */}
            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: '#666' }}>
                T.C. KİMLİK NUMARASI (KİLİTLİ)
              </label>
              <input
                type="text"
                disabled
                value={formData.identityNumber}
                style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#eae8e7', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box', cursor: 'not-allowed', color: '#555' }}
              />
            </div>

            {/* AD VE SOYAD YAN YANA GİRİDİ */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>AD</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>SOYAD</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* E-POSTA ADRESİ */}
            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                E-POSTA ADRESİ (YENİ GİRİŞ KİMLİĞİ)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* ALTYAPI GÜVENLİK BİLGİLENDİRMESİ */}
            <div style={{ border: '1px dashed #041632', padding: '10px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#555', backgroundColor: '#fbf9f8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#006600', flexShrink: 0 }} />
              <span>Kimlik numarası doğrulanmış hesapların kritik CBS konumu ve port kilitleri güvenlikle korunmaktadır.</span>
            </div>

            {/* GÜNCELLE BUTONU */}
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#041632', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', padding: '12px', marginTop: '4px', border: '2px solid #041632', cursor: 'pointer', boxShadow: '3px 3px 0px 0px #041632', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Save size={16} />
              {loading ? 'BSS VERİLERİ MÜHÜRLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}