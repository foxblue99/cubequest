import { getToken } from '@/lib/auth';

const API_BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return getToken();
  }

  private headers(isFormData = false): Record<string, string> {
    const h: Record<string, string> = {};
    if (!isFormData) h['Content-Type'] = 'application/json';
    const token = this.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers: extraHeaders } = options;
    const isFormData = body instanceof FormData;
    const url = `${this.baseUrl}${path}`;

    const res = await fetch(url, {
      method,
      headers: { ...this.headers(isFormData), ...extraHeaders },
      body: body && !isFormData ? JSON.stringify(body) : (body as BodyInit | undefined),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, err.message || 'Request failed');
    }

    return res.json();
  }

  get<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Auth
  async login(phone: string, password: string) {
    return this.post<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { phone, password }
    );
  }

  async register(data: {
    role: string;
    phone: string;
    password: string;
    nickname: string;
    birthYear?: number;
    city?: string;
  }) {
    return this.post<{ user: unknown; tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/register',
      data
    );
  }

  async getMe() {
    return this.get<{ user: unknown; studentProfile?: unknown }>('/auth/me');
  }

  // Courses
  async getCourses(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<{ courses: unknown[] }>(`/courses${qs}`);
  }

  async getCourse(id: string) {
    return this.get<{ course: unknown }>(`/courses/${id}`);
  }

  async getCourseLessons(courseId: string) {
    return this.get<{ lessons: unknown[] }>(`/courses/${courseId}/lessons`);
  }

  async completeLesson(lessonId: string) {
    return this.post(`/lessons/${lessonId}/complete`);
  }

  // Formulas
  async getFormulas(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<{ formulas: unknown[] }>(`/formulas${qs}`);
  }

  async getFormula(id: string) {
    return this.get<{ formula: unknown }>(`/formulas/${id}`);
  }

  async updateFormulaProgress(formulaId: string, data: { status: string }) {
    return this.post(`/formulas/${formulaId}/progress`, data);
  }

  async toggleFavorite(formulaId: string, favorite: boolean) {
    if (favorite) {
      return this.post(`/formulas/${formulaId}/favorite`);
    }
    return this.delete(`/formulas/${formulaId}/favorite`);
  }

  // Results
  async createResult(data: {
    eventType: string;
    scramble: string;
    timeMs: number;
    penalty: string;
    note?: string;
    crossMs?: number;
    f2lMs?: number;
    ollMs?: number;
    pllMs?: number;
  }) {
    return this.post<{ result: unknown; stats: unknown }>('/results', data);
  }

  async getMyResults(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/results/me${qs}`);
  }

  async getMyStats() {
    return this.get<{ stats: unknown }>('/results/stats/me');
  }

  async updateResult(id: string, data: { penalty?: string; note?: string }) {
    return this.patch(`/results/${id}`, data);
  }

  async deleteResult(id: string) {
    return this.delete(`/results/${id}`);
  }

  // Tasks
  async getTodayTasks() {
    return this.get<{ tasks: unknown[] }>('/tasks/today');
  }

  async updateTaskProgress(taskId: string) {
    return this.post(`/tasks/${taskId}/progress`);
  }

  // Achievements
  async getMyAchievements() {
    return this.get<{ achievements: unknown[] }>('/achievements/me');
  }

  // Events
  async getEvents(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<{ events: unknown[] }>(`/events${qs}`);
  }

  async getEvent(id: string) {
    return this.get<{ event: unknown }>(`/events/${id}`);
  }

  // Parent
  async generateBindCode() {
    return this.post<{ bindCode: string }>('/parent/bind-code/generate');
  }

  async bindChild(bindCode: string) {
    return this.post('/parent/bind-child', { bindCode });
  }

  async getChildren() {
    return this.get<{ children: unknown[] }>('/parent/children');
  }

  async getChildSummary(childId: string) {
    return this.get<{ summary: unknown }>(`/parent/children/${childId}/summary`);
  }

  // Admin
  async adminGetUsers(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/admin/users${qs}`);
  }

  async adminCreateUser(data: unknown) {
    return this.post('/admin/users', data);
  }

  async adminUpdateUser(id: string, data: unknown) {
    return this.patch(`/admin/users/${id}`, data);
  }

  async adminDeleteUser(id: string) {
    return this.delete(`/admin/users/${id}`);
  }

  async adminResetPassword(id: string, password: string) {
    return this.post(`/admin/users/${id}/reset-password`, { password });
  }

  // Categories
  async adminGetCategories() { return this.get('/admin/categories'); }
  async adminCreateCategory(d: unknown) { return this.post('/admin/categories', d); }
  async adminUpdateCategory(id: string, d: unknown) { return this.patch(`/admin/categories/${id}`, d); }
  async adminDeleteCategory(id: string) { return this.delete(`/admin/categories/${id}`); }

  async adminGetCourses() {
    return this.get('/admin/courses');
  }

  async adminCreateCourse(data: unknown) {
    return this.post('/admin/courses', data);
  }

  async adminUpdateCourse(id: string, data: unknown) {
    return this.patch(`/admin/courses/${id}`, data);
  }

  async adminDeleteCourse(id: string) {
    return this.delete(`/admin/courses/${id}`);
  }

  async adminCreateLesson(data: unknown) {
    return this.post('/admin/lessons', data);
  }

  async adminUpdateLesson(id: string, data: unknown) {
    return this.patch(`/admin/lessons/${id}`, data);
  }

  async adminGetFormulas() {
    return this.get('/admin/formulas');
  }

  async adminCreateFormula(data: unknown) {
    return this.post('/admin/formulas', data);
  }

  async adminUpdateFormula(id: string, data: unknown) {
    return this.patch(`/admin/formulas/${id}`, data);
  }

  async adminDeleteFormula(id: string) {
    return this.delete(`/admin/formulas/${id}`);
  }

  async adminGetEvents() {
    return this.get('/admin/events');
  }

  async adminCreateEvent(data: unknown) {
    return this.post('/admin/events', data);
  }

  async adminUpdateEvent(id: string, data: unknown) {
    return this.patch(`/admin/events/${id}`, data);
  }

  async adminDeleteEvent(id: string) {
    return this.delete(`/admin/events/${id}`);
  }

  // ── 部落管理 ──
  async adminGetTribePosts(page?: number) {
    return this.get(`/admin/tribe-posts${page ? `?page=${page}` : ''}`);
  }
  async adminDeleteTribePost(id: string) {
    return this.delete(`/admin/tribe-posts/${id}`);
  }
  async adminTogglePin(id: string) {
    return this.post(`/admin/tribe-posts/${id}/toggle-pin`);
  }

  // ── Activities / 赛事活动 ──
  async getActivities(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.get(`/activities${q}`);
  }
  async getActivity(id: string) { return this.get(`/activities/${id}`) }
  async getActivityLeaderboard(id: string) { return this.get(`/activities/${id}/leaderboard`) }
  async submitToActivity(id: string, data: { sessionToken: string; timeMs: number; scramble: string; penalty?: string; videoUrl?: string }) {
    return this.post(`/activities/${id}/submit`, data);
  }
  async submitVideoVerify(solveId: string, videoUrl: string) {
    return this.post(`/activities/${solveId}/video-verify`, { videoUrl });
  }

  // Admin — activities
  async adminCreateActivity(d: unknown) { return this.post('/activities', d) }
  async adminGetPendingVideos(activityId?: string) {
    return this.get(`/activities/video-verification/pending${activityId ? `?activityId=${activityId}` : ''}`);
  }
  async adminReviewVideo(logId: string, approved: boolean, reason?: string) {
    return this.post(`/activities/video-verification/${logId}/review`, { approved, reason });
  }
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient(API_BASE);
