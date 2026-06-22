import axios from 'axios';

// Backend kök URL'i: http://localhost:8080/api/v1
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 🔄 AXIOS INTERCEPTOR: İstek gitmeden hemen önce devreye giren güvenli asistanımız
api.interceptors.request.use(
  (config) => {
    // Tarayıcının hafızasından (LocalStorage) token'ı kontrol ediyoruz
    const token = localStorage.getItem('token');
    
    // Eğer token varsa (yani kullanıcı giriş yapmışsa), HTTP Header'ına "Bearer <token>" olarak ekliyoruz
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 1. ADRES YÖNETİMİ (AddressController)
export const AddressService = {
  getDistricts: async () => {
    return await api.get('/addresses/districts');
  },
  getNeighborhoods: async (district) => {
    return await api.get('/addresses/neighborhoods', { params: { district } });
  },
  getStreets: async (district, neighborhood) => {
    return await api.get('/addresses/streets', { params: { district, neighborhood } });
  },
  getBuildings: async (district, neighborhood, street) => {
    return await api.get('/addresses/buildings', { params: { district, neighborhood, street } });
  }
};

// 2. FİZİBİLİTE / ALTYAPI SORGULAMA (FeasibilityController)
export const FeasibilityService = {
  // Senaryo A: Form üzerinden BBK Kodu ile sorgulama
  checkByBbk: async (code) => {
    return await api.get('/feasibility/bbk', { params: { code } });
  },
  // Senaryo B: Harita üzerinden koordinat ile sorgulama
  checkByCoordinates: async (lat, lng) => {
    return await api.get('/feasibility/coordinates', { params: { lat, lng } });
  }
};

// 3. SİPARİŞ VE ASENKRON SÜREÇLER (OrderController)
export const OrderService = {
  // Yeni Sipariş Fırlatma (Inquiry sayfasından tetiklenecek)
  createOrder: async (orderRequestDTO) => {
    return await api.post('/orders', orderRequestDTO);
  },
  
  // Operatör Paneli: Saha dolabına port ekleme ve kuyruk eritme
  updateNodeCapacity: async (nodeId, additionalPorts) => {
    return await api.put(`/orders/nodes/${nodeId}/capacity`, null, {
      params: { additionalPorts }
    });
  },
  
  // Zaman Tüneli: Siparişin geçmiş event'lerini çekme (OrderTracking sayfası için)
  getOrderHistory: async (orderId) => {
    return await api.get(`/orders/${orderId}/history`);
  }
};