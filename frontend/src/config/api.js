import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL, withCredentials: true });
const csrfClient = axios.create({ baseURL, withCredentials: true });
let csrfToken;
let csrfPromise;

export async function renovarCsrf() {
  csrfToken = undefined;
  if (!csrfPromise) csrfPromise = csrfClient.get('/auth/csrf')
    .then(({ data }) => { csrfToken = data.token; return csrfToken; })
    .finally(() => { csrfPromise = undefined; });
  return csrfPromise;
}
api.interceptors.request.use(async config => {
  if (!['get', 'head', 'options'].includes((config.method || 'get').toLowerCase()))
    config.headers['X-CSRF-TOKEN'] = csrfToken || await renovarCsrf();
  return config;
});
api.interceptors.response.use(response => response, async error => {
  const config = error.config;
  if (error.response?.status === 400 && error.response.data?.code === 'csrf_invalid' && config && !config._csrfReenviado) {
    // O servidor recusou antes da ação. Uma atualização de chave/identidade permite obter novo CSRF.
    config._csrfReenviado = true;
    await renovarCsrf();
    return api.request(config);
  }
  if (error.response?.status === 401 && !config?.url?.toLowerCase().includes('/auth/') && window.location.pathname.startsWith('/dashboard/'))
    window.location.replace('/login');
  return Promise.reject(error);
});
export default api;
