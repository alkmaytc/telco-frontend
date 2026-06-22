import React, { createContext, useState, useEffect } from 'react';

// Diğer sayfaların bu havuza erişmesi için Context'i dışarı açıyoruz
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Kullanıcının gitmek istediği korumalı sayfayı (Örn: Sipariş Takip) 
    // aklında tutacak olan akıllı state kanka
    const [redirectTo, setRedirectTo] = useState(null); 

    useEffect(() => {
        // Sayfa her yenilendiğinde tarayıcının hafızasına bakıyoruz kanka
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const fullName = localStorage.getItem('fullName');

        if (token && role) {
            // Eğer kartlar geçerliyse kullanıcıyı oturumu açık kabul ediyoruz
            setUser({ token, role, fullName });
        }
        setLoading(false);
    }, []);

    // Giriş Başarılı Olduğunda Tetiklenecek Fonksiyon
    const login = (authData) => {
        localStorage.setItem('token', authData.token);
        localStorage.setItem('role', authData.role);
        localStorage.setItem('fullName', authData.fullName);
        setUser({
            token: authData.token,
            role: authData.role,
            fullName: authData.fullName
        });
    };

    // Güvenli Çıkış Yapıldığında Tetiklenecek Fonksiyon
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('fullName');
        // Geçici BBK verileri varsa temizlemek istersen buraya ekleyebiliriz kanka
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, redirectTo, setRedirectTo }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};