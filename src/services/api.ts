const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL

export interface UploadResponse {
  doc_id: string;
  gs_path: string;
  message: string;
  corpus_name?: string;
}

export interface SummarizeResponse {
  doc_id: string;
  summary: string;
  rag_corpus?: string;
  debug?: any;
  fallback: boolean;
}

export interface RiskItem {
  id: string;
  severity_level: string;
  severity_score: number;
  snippet: string;
  label: string;
  short_risk?: string;
  explanation?: string;
  recommendations?: string[];
}

export interface RisksResponse {
  doc_id: string;
  risks: RiskItem[];
  note?: string;
}

export interface ChatResponse {
  doc_id: string;
  response: string;
  debug?: any;
  fallback: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async uploadPdf(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/upload_pdf`;
    
    console.log('API Service - Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      url: url
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });
      
      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error response:', errorData);
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload success:', result);
      return result;
    } catch (error) {
      console.error('Upload request failed:', error);
      throw error;
    }
  }

  async summarize(docId: string, displayName?: string): Promise<SummarizeResponse> {
    return this.request<SummarizeResponse>('/summarize', {
      method: 'POST',
      body: JSON.stringify({
        doc_id: docId,
        display_name: displayName || 'legal_doc_corpus'
      }),
    });
  }

  async getRisks(docId: string): Promise<RisksResponse> {
    return this.request<RisksResponse>('/risks', {
      method: 'POST',
      body: JSON.stringify({
        doc_id: docId
      }),
    });
  }

  async chat(docId: string, messages: ChatMessage[], sessionId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        doc_id: docId,
        messages,
        session_id: sessionId
      }),
    });
  }

  async debugRag(docId: string): Promise<any> {
    return this.request(`/debug_rag/${docId}`, {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
