// Используем переменную окружения для URL сервера
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

console.log('🔧 API Configuration:', {
    API_URL,
    timestamp: new Date().toISOString()
});

// Вспомогательная функция для создания запросов с логированием
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    // Получаем токен из localStorage
    const token = localStorage.getItem('access_token');
    
    // Формируем заголовки
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Token added to request');
    } else {
        console.log('⚠️ No token found in localStorage');
    }
    
    // Подготавливаем конфигурацию запроса
    const config = {
        method: options.method || 'GET',
        headers,
        ...options,
    };
    
    // Если есть body, конвертируем в JSON (кроме FormData и Blob)
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData) && !(options.body instanceof Blob)) {
        config.body = JSON.stringify(options.body);
    }
    
    // Логируем исходящий запрос
    console.log('📤 OUTGOING REQUEST:', {
        method: config.method,
        url: endpoint,
        fullURL: url,
        headers: config.headers,
        body: options.body,
        params: options.params,
    });
    
    try {
        const response = await fetch(url, config);
        
        // Логируем ответ
        console.log('📬 RESPONSE RECEIVED:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries()),
        });
        
        // Если ответ не успешный, обрабатываем ошибку
        if (!response.ok) {
            let errorData;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                errorData = await response.text();
            }
            
            console.error('❌ RESPONSE ERROR:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                data: errorData,
            });
            
            // Обработка 401 ошибки (истек токен)
            if (response.status === 401) {
                console.log('🔄 401 detected, should implement token refresh here');
                // Здесь можно добавить логику обновления токена
            }
            
            // Создаем объект ошибки
            const error = new Error(`HTTP Error: ${response.status}`);
            error.response = {
                status: response.status,
                statusText: response.statusText,
                data: errorData,
            };
            throw error;
        }
        
        // Парсим успешный ответ
        let data;
        const contentType = response.headers.get('content-type');
        
        // Для blob (PDF, файлы)
        if (options.responseType === 'blob') {
            data = await response.blob();
            console.log('✅ RESPONSE SUCCESS (Blob):', {
                status: response.status,
                url: response.url,
                blobSize: data.size,
                blobType: data.type,
            });
        }
        // Для JSON
        else if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('✅ RESPONSE SUCCESS (JSON):', {
                status: response.status,
                url: response.url,
                data: data,
            });
        }
        // Для текста
        else {
            data = await response.text();
            console.log('✅ RESPONSE SUCCESS (Text):', {
                status: response.status,
                url: response.url,
                data: data,
            });
        }
        
        return { data, status: response.status, headers: response.headers };
        
    } catch (error) {
        // Ловим ошибки сети (CORS, нет соединения и т.д.)
        console.error('❌ REQUEST FAILED:', {
            message: error.message,
            name: error.name,
            url: url,
            method: config.method,
        });
        
        // Определяем CORS ошибку
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🚫 CORS/NETWORK ERROR DETECTED:', {
                message: 'This is likely a CORS or network connectivity issue',
                url: url,
                method: config.method,
                possibleCauses: [
                    'Backend CORS not configured',
                    'corsheaders not installed',
                    'CorsMiddleware not in MIDDLEWARE',
                    'Wrong origin in CORS_ALLOWED_ORIGINS',
                    'Backend not running',
                    'Network connectivity issue',
                ]
            });
        }
        
        throw error;
    }
}

// --- МЕТОДЫ API ---

export const authApi = {
    login: async (credentials) => {
        console.log('🔐 authApi.login called with:', {
            username: credentials.username,
            password: credentials.password,
            hasPassword: !!credentials.password,
            passwordLength: credentials.password?.length
        });
        
        return apiRequest('/auth/login/', {
            method: 'POST',
            body: credentials,
        });
    },
    
    refresh: async (refresh) => {
        console.log('🔄 authApi.refresh called');
        
        return apiRequest('/auth/refresh/', {
            method: 'POST',
            body: { refresh },
        });
    },
};

export const clientApi = {
    getAll: async (search = '') => {
        console.log('👥 clientApi.getAll called, search:', search);
        
        const endpoint = search ? `/clients/?search=${search}` : '/clients/';
        return apiRequest(endpoint, { method: 'GET' });
    },
    
    getById: async (id) => {
        console.log('👤 clientApi.getById called, id:', id);
        
        return apiRequest(`/clients/${id}/`, { method: 'GET' });
    },
    
    create: async (data) => {
        console.log('➕ clientApi.create called with:', data);
        
        return apiRequest('/clients/', {
            method: 'POST',
            body: data,
        });
    },
    
    update: async (id, data) => {
        console.log('✏️ clientApi.update called, id:', id, 'data:', data);
        
        return apiRequest(`/clients/${id}/`, {
            method: 'PUT',
            body: data,
        });
    },
    
    delete: async (id) => {
        console.log('🗑️ clientApi.delete called, id:', id);
        
        return apiRequest(`/clients/${id}/`, { method: 'DELETE' });
    },
};

export const trainingApi = {
    getSchedule: async () => {
        console.log('📅 trainingApi.getSchedule called');
        
        return apiRequest('/trainings/', { method: 'GET' });
    },
    
    register: async (trainingId, clientId) => {
        console.log('📝 trainingApi.register called, trainingId:', trainingId, 'clientId:', clientId);
        
        return apiRequest(`/trainings/${trainingId}/register_client/`, {
            method: 'POST',
            body: { client_id: clientId },
        });
    },
};

export const reportApi = {
    getRevenue: async () => {
        console.log('💰 reportApi.getRevenue called');
        
        return apiRequest('/reports/revenue/', {
            method: 'GET',
            responseType: 'blob',
        });
    },
    
    getAttendance: async () => {
        console.log('📊 reportApi.getAttendance called');
        
        return apiRequest('/reports/attendance/', {
            method: 'GET',
            responseType: 'blob',
        });
    },
    
    getTrainers: async () => {
        console.log('👨‍🏫 reportApi.getTrainers called');
        
        return apiRequest('/reports/trainer_performance/', {
            method: 'GET',
            responseType: 'blob',
        });
    },
};

// Экспортируем также вспомогательную функцию для прямого использования
export const api = {
    get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
    post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body }),
    put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body }),
    delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' }),
};

export default api;