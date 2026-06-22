import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios'; // 🎯 Bağımlılık hatasını çözmek için doğrudan axios'a çektik kanka

export default function Auth() {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const { login, redirectTo, setRedirectTo } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form State'leri
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

  // 🚪 1. GİRİŞ YAPMA FONKSİYONU
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });

      login(response.data);

      if (response.data.role === 'ADMIN') {
        navigate('/admin');
      } else if (redirectTo) {
        const destination = redirectTo;
        setRedirectTo(null);
        navigate(destination);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'E-posta adresi veya şifre hatalı!'
      });
    } finally {
      setLoading(false);
    }
  };

  // 📝 2. KAYIT OLMA FONKSİYONU
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    const lat = localStorage.getItem('selected_lat') ? parseFloat(localStorage.getItem('selected_lat')) : null;
    const lng = localStorage.getItem('selected_lng') ? parseFloat(localStorage.getItem('selected_lng')) : null;

    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        identityNumber,
        firstName,
        lastName,
        email,
        password,
        latitude: lat,
        longitude: lng
      });

      setMessage({ type: 'success', text: 'KAYIT BAŞARIYLA TAMAMLANDI! OTURUM AÇILIYOR...' });
      
      setTimeout(() => {
        login(response.data);
        if (redirectTo) {
          const destination = redirectTo;
          setRedirectTo(null);
          navigate(destination);
        } else {
          navigate('/');
        }
      }, 1200);

    } catch (error) {
      console.error(error);
      setMessage({
        type: 'error',
        text: typeof error.response?.data === 'string' ? error.response.data : 'Kayıt sırasında şebeke veya T.C. kimlik hatası oluştu!'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 66px)', backgroundColor: '#fbf9f8', color: '#041632', display: 'flex', alignItems: 'center', justifyWith: 'center', display: 'flex', justifyContent: 'center', padding: '24px', fontFamily: 'Hanken Grotesk, sans-serif' }}>
      
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', border: '2px solid #041632', padding: '32px', boxShadow: '6px 6px 0px 0px #041632', position: 'relative' }}>
        
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(251, 249, 248, 0.85)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700' }}>
            <Loader2 className="animate-spin mb-2" style={{ color: '#041632', width: '32px', height: '32px' }} />
            KİMLİK DOĞRULANIYOR...
          </div>
        )}

        <h2 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', marginBottom: '24px', letterSpacing: '-0.02em' }}>
          TELCO HESAP MERKEZİ
        </h2>

        <div style={{ display: 'flex', border: '2px solid #041632', marginBottom: '24px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: '700' }}>
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setMessage({ type: '', text: '' }); }}
            style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', backgroundColor: isLoginTab ? '#041632' : '#ffffff', color: isLoginTab ? '#ffffff' : '#041632', transition: 'all 0.15s ease' }}
          >
            GİRİŞ YAP
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setMessage({ type: '', text: '' }); }}
            style={{ flex: 1, padding: '10px', borderLeft: '2px solid #041632', borderTop: 'none', borderBottom: 'none', borderRight: 'none', cursor: 'pointer', backgroundColor: !isLoginTab ? '#041632' : '#ffffff', color: !isLoginTab ? '#ffffff' : '#041632', transition: 'all 0.15s ease' }}
          >
            KAYIT OL
          </button>
        </div>

        {message.text && (
          <div style={{ border: `2px solid ${message.type === 'error' ? 'red' : 'green'}`, padding: '10px', marginBottom: '20px', fontSize: '11px', color: message.type === 'error' ? 'red' : 'green', fontWeight: 'bold', fontFamily: 'JetBrains Mono, monospace', backgroundColor: message.type === 'error' ? '#fff5f5' : '#f5fff5' }}>
            <AlertTriangle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            {message.text}
          </div>
        )}

        {isLoginTab ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>E-POSTA ADRESİ</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>ŞİFRE</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" style={{ width: '100%', backgroundColor: '#041632', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', padding: '12px', marginTop: '8px', border: '2px solid #041632', cursor: 'pointer', boxShadow: '3px 3px 0px 0px #041632' }}>
              SİSTEME GİRİŞ YAP
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>T.C. KİMLİK NUMARASI</label>
              <input
                type="text"
                required
                maxLength="11"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>AD</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>SOYAD</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>E-POSTA</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>ŞİFRE SEÇİNİZ</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', border: '2px solid #041632', backgroundColor: '#fbf9f8', padding: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ border: '1px dashed #041632', padding: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#555', backgroundColor: '#fbf9f8' }}>
              ℹ️ CBS ENTEGRASYONU: Haritada seçtiğiniz konum ev koordinatınız olarak sisteme kalıcı olarak eklenecektir.
            </div>

            <button type="submit" style={{ width: '100%', backgroundColor: '#041632', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', padding: '12px', marginTop: '4px', border: '2px solid #041632', cursor: 'pointer', boxShadow: '3px 3px 0px 0px #041632' }}>
              YENİ KAYIT OLUŞTUR
            </button>
          </form>
        )}
      </div>
    </div>
  );
}