const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const apiRequest = async (endpoint, options = {}) => {
  const { headers = {}, ...otherOptions } = options;

  const isFormData = otherOptions.body instanceof FormData;
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...otherOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
};
