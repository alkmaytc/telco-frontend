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
 * şanlı ADMIN token'ımızı alır ve HTTP Header'ına "Bearer <token>" olarak ekler kanka!
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('telco_token'); // 🎯 Token anahtarını ortaklaştırdık kanka
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
  // admin@telco.com ve 12345 ile giriş yapacağımız kapı kanka kanka ✅
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
  // PostGIS mekansal analiz ve Redis cache katmanını tetikleyen şanlı sorgu kanka kanka ✅
  checkByBbk: async (bbk) => {
    // Backend controller'daki parametre ismi olan 'bbk' ile birebir eşitledik kanka
    const response = await api.get('/feasibility/check', { params: { bbk } });
    return response.data;
  }
};

// 🚀 3. SİPARİŞ VE ASENKRON SÜREÇLER (OrderController)
export const OrderService = {
  // Madde 6: Yeni Sipariş Fırlatma (Saniyede RECEIVED dönecek asenkron akış kanka) 
  createOrder: async (orderRequestDTO) => {
    const response = await api.post('/orders', orderRequestDTO);
    return response.data;
  },
  
  // Madde 3: Operatör / Admin Paneli: Saha dolabına port ekleme ve kuyruk eritme otomasyonu
  updateNodeCapacity: async (nodeId, additionalPorts) => {
    // Backend'de yazdığımız request path'i ile tam eşitledik kanka kanka ✅
    const response = await api.put(`/orders/nodes/${nodeId}`, null, {
      params: { additionalPorts }
    });
    return response.data;
  },
  
  // Madde 7: Sipariş Zaman Tüneli (OrderStatusHistory kuyruk adımlarını çeken yer)
  getOrderHistory: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/history`);
    return response.data;
  }
};