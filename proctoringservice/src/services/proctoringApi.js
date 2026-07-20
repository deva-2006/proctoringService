const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const incrementWarning = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/warning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });

  return response.json();
};

export const completeSession = async (sessionId, status) => {
  const response = await fetch(`${API_BASE_URL}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      status,
    }),
  });

  return response.json();
};