import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000,
})

/*
Central API helper
All frontend → backend communication goes here
*/

export const api = {

  /* ---------- Upload Book ---------- */

  uploadBook: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /* ---------- Load Demo Book ---------- */

  loadDemoBook: async () => {
    try {
      const response = await apiClient.post("/load_demo");
      return response.data;
    } catch (error) {
      console.error("Demo load error:", error);
      throw error;
    }
  },

  /* ---------- Ask Question ---------- */

  askQuestion: async (
    question: string,
    selectedText?: string,
    pageNumber?: number
  ) => {
    try {
      const response = await apiClient.post("/ask", {
        question,
        selected_text: selectedText,
        page_number: pageNumber,
      });

      return response.data;
    } catch (error) {
      console.error("Ask API error:", error);
      throw error;
    }
  },

  /* ---------- Page Tracking ---------- */

  setPage: async (page: number) => {
    try {
      const response = await apiClient.post("/set_page", {
        page,
      });

      return response.data;
    } catch (error) {
      console.error("Page tracking error:", error);
      throw error;
    }
  },

  /* ---------- Debug Pages ---------- */

  getPages: async () => {
    try {
      const response = await apiClient.get("/pages");
      return response.data;
    } catch (error) {
      console.error("Get pages error:", error);
      throw error;
    }
  },

  /* ---------- Get PDF URL ---------- */

  getPdfUrl: () => {
    return `${API_BASE_URL}/pdf`;
  },

};