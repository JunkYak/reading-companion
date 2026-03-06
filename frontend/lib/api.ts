import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const api = {
  uploadBook: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  askQuestion: async (question: string, selectedText?: string, pageNumber?: number) => {
    const response = await apiClient.post('/ask', {
      question,
      selected_text: selectedText,
      page_number: pageNumber,
    });
    return response.data;
  },

  setPage: async (page: number) => {
    const response = await apiClient.post('/set_page', {
      page,
    });
    return response.data;
  },
};
