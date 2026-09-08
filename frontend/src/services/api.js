const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('careerpilot_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      errorMsg = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Authentication & Profile
  auth: {
    googleLogin: (tokenOrCredential) =>
      fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: tokenOrCredential, id_token: tokenOrCredential })
      }).then(handleResponse),

    demoLogin: () =>
      fetch(`${API_BASE}/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(handleResponse),

    saveOnboarding: (data) =>
      fetch(`${API_BASE}/auth/onboarding`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    getMe: () =>
      fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    updateProfile: (data) =>
      fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse)
  },

  // Resume Analyzer & Information Extraction
  resume: {
    upload: (file) => {
      const token = localStorage.getItem('careerpilot_token');
      const formData = new FormData();
      formData.append('resume', file);

      return fetch(`${API_BASE}/resume/analyze`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      }).then(handleResponse);
    },

    getLatest: () =>
      fetch(`${API_BASE}/resume/latest`, {
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  // Smart Roadmap
  roadmap: {
    generate: (data) =>
      fetch(`${API_BASE}/roadmap/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    getAll: () =>
      fetch(`${API_BASE}/roadmap`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    toggleTask: (taskId, is_completed) =>
      fetch(`${API_BASE}/roadmap/tasks/${taskId}/toggle`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_completed })
      }).then(handleResponse),

    updateTask: (taskId, task_description) =>
      fetch(`${API_BASE}/roadmap/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ task_description })
      }).then(handleResponse)
  },

  // AI Planner (Human + AI Collaborative Planning)
  planner: {
    get: (type = 'weekly') =>
      fetch(`${API_BASE}/planner?type=${type}`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    generateAI: () =>
      fetch(`${API_BASE}/planner/generate`, {
        method: 'POST',
        headers: getAuthHeaders()
      }).then(handleResponse),

    saveTasks: (tasks) =>
      fetch(`${API_BASE}/planner/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ tasks })
      }).then(handleResponse),

    analyze: (tasks) =>
      fetch(`${API_BASE}/planner/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ tasks })
      }).then(handleResponse),

    optimize: (optimized_tasks) =>
      fetch(`${API_BASE}/planner/optimize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ optimized_tasks })
      }).then(handleResponse)
  },

  // 24/7 Career Chatbot
  chat: {
    getHistory: () =>
      fetch(`${API_BASE}/chat/history`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    sendMessage: (message, language) =>
      fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, language })
      }).then(handleResponse),

    clearHistory: () =>
      fetch(`${API_BASE}/chat/history`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  // Goals
  goals: {
    getAll: () =>
      fetch(`${API_BASE}/goals`, {
        headers: getAuthHeaders()
      }).then(handleResponse),

    create: (data) =>
      fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    update: (goalId, data) =>
      fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }).then(handleResponse),

    delete: (goalId) =>
      fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  // Reminders & 2-Hour Agent Check-in
  reminders: {
    sendTest: () =>
      fetch(`${API_BASE}/reminders/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      }).then(handleResponse),

    checkin2h: () =>
      fetch(`${API_BASE}/reminders/checkin-2h`, {
        method: 'POST',
        headers: getAuthHeaders()
      }).then(handleResponse),

    getAll: () =>
      fetch(`${API_BASE}/reminders`, {
        headers: getAuthHeaders()
      }).then(handleResponse)
  },

  // Admin Analytics
  admin: {
    getStats: () =>
      fetch(`${API_BASE}/admin/stats`).then(handleResponse)
  }
};
