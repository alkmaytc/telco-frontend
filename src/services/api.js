import axios from 'axios';

// 🎯 BACKEND ANA KAPISI: Spring Boot 8080 portuna köprü kuruyoruz kanka ✅
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 🛡️ SİBER GÜVENLİK INTERCEPTOR MOTORU
 * Her istek gitmeden hemen önce devreye girer. Tarayıcı hafızasındaki (LocalStorage)
 * şanlı token'ımızı alır ve HTTP Header'ına "Bearer <token>" olarak ekler kanka!
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('telco_token'); // Token anahtarını ortaklaştırdık kanka
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ❌ GLOBAL ERROR INTERCEPTOR
 * Backend'deki GlobalExceptionHandler'dan dönen kurumsal hata JSON'larını yakalar.
 * Yetki patlaması (401/403) anında güvenliği korumak için hafızayı temizler kanka. ✅
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data) {
      // Backend'in bize fırlattığı siber güvenli ErrorResponseDTO'yu doğrudan arayüze paslıyoruz kanka
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: 'Sunucuyla bağlantı kesildi. Backend altyapısını kontrol edin!' });
  }
);

// 🔐 0. KULLANICI GİRİŞ VE YETKİLENDİRME (AuthController)
export const AuthService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (registerData) => {
    const response = await api.post('/auth/register', registerData);
    return response.data;
  }
};

// 🗺️ 1. ADRES YÖNETİMİ (AddressController)
export const AddressService = {
  getDistricts: async () => {
    const response = await api.get('/addresses/districts');
    return response.data;
  },
  getNeighborhoods: async (district) => {
    const response = await api.get('/addresses/neighborhoods', { params: { district } });
    return response.data;
  },
  getStreets: async (district, neighborhood) => {
    const response = await api.get('/addresses/streets', { params: { district, neighborhood } });
    return response.data;
  },
  getBuildings: async (district, neighborhood, street) => {
    const response = await api.get('/addresses/buildings', { params: { district, neighborhood, street } });
    return response.data;
  }
};

// 🔍 2. FİZİBİLİTE / REDIS CACHING MOTORU (FeasibilityController)
export const FeasibilityService = {
  checkByBbk: async (bbkCode) => {
    const response = await api.get('/feasibility/bbk', { params: { code: bbkCode } });
    return response.data;
  }
};

// 🚀 3. SİPARİŞ VE ASENKRON SÜREÇLER (OrderController)
export const OrderService = {
  createOrder: async (orderRequestDTO) => {
    const response = await api.post('/orders', orderRequestDTO);
    return response.data;
  },
  updateNodeCapacity: async (nodeId, additionalPorts) => {
    const response = await api.put(`/orders/nodes/${nodeId}`, null, {
      params: { additionalPorts }
    });
    return response.data;
  },
  getOrderHistory: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/history`);
    return response.data;
  },
  // 🎯 DÜZELTİLEN METOT: Backend ile %100 uyumlu hale getirildi (my-orders) ✅
  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  }
};

// 👤 4. MÜŞTERİ PROFİL İŞLEMLERİ (UserController)
export const UserService = {
  // Giriş yapmış abonenin (Customer) Ad, Soyad, E-posta verilerini getirir
  getMyProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  // Profil bilgilerini (Ad, Soyad, E-posta) günceller
  updateMyProfile: async (profileDTO) => {
    const response = await api.put('/users/me', profileDTO);
    return response.data;
  }
};

export default api;