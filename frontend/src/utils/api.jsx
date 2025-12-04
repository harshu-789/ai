export const api = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${import.meta.env.VITE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => null);

  return { res, data };
};
