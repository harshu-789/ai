export const api = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${import.meta.env.VITE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (res.status === 401 || res.status === 403) {
    alert("Invalid or expired token");
     localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
  }

  return res.json();
};


