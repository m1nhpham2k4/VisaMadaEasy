import axios from 'axios';

// Cấu hình URL cơ sở - được tập trung ở một nơi duy nhất
// Use environment variable with fallback for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Thêm interceptor để tự động gắn token vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý các lỗi response
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response.status === 401 && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Can't refresh, so logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenType');
          localStorage.removeItem('guestId');
          window.location.href = '/'; // Redirect to landing page
          return Promise.reject(error);
        }

        const res = await axios.get(`${API_URL}/auth/refresh`, {
          headers: { 'Authorization': `Bearer ${refreshToken}` }
        });

        if (res.status === 200) {
          localStorage.setItem('accessToken', res.data.access_token);
          if (res.data.refresh_token) {
            localStorage.setItem('refreshToken', res.data.refresh_token);
          }
          
          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.access_token;
          originalRequest.headers['Authorization'] = 'Bearer ' + res.data.access_token;
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('guestId');
        window.location.href = '/'; // Redirect to landing page
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      // Handle other errors if needed
      switch (error.response.status) {
        case 403:
          console.log('Không có quyền truy cập');
          break;
        case 500:
          console.log('Lỗi server');
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

// Hàm trợ giúp để thay đổi URL cơ sở nếu cần
export const setBaseURL = (newURL) => {
  apiClient.defaults.baseURL = newURL;
};

export default apiClient; 