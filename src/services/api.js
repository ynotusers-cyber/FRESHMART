const API_BASE_URL = 'http://54.144.58.195';

let _authToken = null;

export const setAuthToken  = (token) => { _authToken = token; };
export const clearAuthToken = ()      => { _authToken = null;  };

const headers = () => ({
  'Content-Type': 'application/json',
  ..._authToken ? { Authorization: `Bearer ${_authToken}` } : {},
});

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

// ─── SALES ───────────────────────────────────────────────────────────────────
export const fetchSales = (fromDate, toDate, ccode = 1) =>
  request(`/sales?fromDate=${fromDate}&toDate=${toDate}&ccode=${ccode}`);

export const fetchTodaySales = (ccode = 1) => {
  const today = new Date().toISOString().split('T')[0];
  return fetchSales(today, today, ccode);
};

export const fetchMonthSales = (ccode = 1) => {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
                 .toISOString().split('T')[0];
  const to   = now.toISOString().split('T')[0];
  return fetchSales(from, to, ccode);
};

// ─── DAY WISE SALES ──────────────────────────────────────────────────────────
export const fetchDayWiseSales = (fromDate, toDate, ccode = 1) =>
  request(`/daywisesales?fromDate=${fromDate}&toDate=${toDate}&ccode=${ccode}`);

// ─── DEPARTMENT WISE SALES ───────────────────────────────────────────────────
export const fetchDeptWiseSales = (fromDate, toDate, ccode = 1) =>
  request(`/deptwisesales?fromDate=${fromDate}&toDate=${toDate}&ccode=${ccode}`);