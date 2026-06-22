import React, { createContext, useState, useEffect } from 'react';

// Diğer bileşenlerin (pages/components) bu havuza erişmesi için Context'i dışarı açıyoruz kanka
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Kullanıcının gitmek istediği korumalı sayfayı (Örn: Sipariş Takip) 
    // aklında tutacak olan akıllı state kanka kanka
    const [redirectTo, setRedirectTo] = useState(null); 

    useEffect(() => {
        // 🎯 Sayfa her yenilendiğinde ortak anahtarlarla hafızaya bakıyoruz kanka ✅
        const token = localStorage.getItem('telco_token');
        const role = localStorage.getItem('telco_role');
        const fullName = localStorage.getItem('telco_fullName');

        if (token && role) {
            // Eğer kartlar geçerliyse kullanıcı oturumunu aktif kabul ediyoruz
            setUser({ token, role, fullName });
        }
        setLoading(false);
    }, []);

    /**
     * 🎯 GİRİŞ BAŞARILI MOTORU
     * admin@telco.com ile giriş yaptığında dönen verileri ortak anahtarlarla hafızaya mühürler!
     */
    const login = (authData) => {
        localStorage.setItem('telco_token', authData.token);
        localStorage.setItem('telco_role', authData.role);
        localStorage.setItem('telco_fullName', authData.fullName);
        
        setUser({
            token: authData.token,
            role: authData.role,
            fullName: authData.fullName
        });
    };

    /**
     * 🚪 GÜVENLİ ÇIKIŞ MOTORU
     * Oturumu kapatırken tarayıcı hafızasını tamamen sıfırlar kanka. ✅
     */
    const logout = () => {
        localStorage.removeItem('telco_token');
        localStorage.removeItem('telco_role');
        localStorage.removeItem('telco_fullName');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, redirectTo, setRedirectTo }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};