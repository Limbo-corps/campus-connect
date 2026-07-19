import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    } catch (error) {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("Request setup error:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const original = error.config;

      if (error.response?.status === 401 && !original?._retry) {
        original._retry = true;

        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true },
        );

        localStorage.setItem("access_token", data.access);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      }

      // Retry 429 (rate limit) and 5xx responses with exponential backoff (max 3 attempts).
      const status = error.response?.status;
      const shouldRetry = status === 429 || (status >= 500 && status < 600);
      if (shouldRetry) {
        original._retryCount = original._retryCount ?? 0;
        const maxRetries = 3;
        if (original._retryCount < maxRetries) {
          original._retryCount += 1;
          const delay = Math.pow(2, original._retryCount) * 200; // ms
          await new Promise((r) => setTimeout(r, delay));
          return api(original);
        }
      }

            console.error("API response error:", {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      return Promise.reject(error);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);
      localStorage.clear();
      return Promise.reject(refreshError);
    }
  },
);

export async function googleLogin(accessToken: string) {
  try {
    const { data } = await api.post<{ access: string }>("/auth/google/", {
      access_token: accessToken,
    });

    return data;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
}

export default api;
