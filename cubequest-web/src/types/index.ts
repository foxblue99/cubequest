// ============================================================
// CubeQuest Type Definitions
// ============================================================

export enum UserRole {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum CourseCategory {
  BEGINNER = 'BEGINNER',
  CFOP_BASIC = 'CFOP_BASIC',
  SUB30 = 'SUB30',
  SUB20 = 'SUB20',
  F2L = 'F2L',
  OLL = 'OLL',
  PLL = 'PLL',
}

export enum LessonType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  INTERACTIVE = 'INTERACTIVE',
  QUIZ = 'QUIZ',
}

export enum FormulaCategory {
  LBL = 'LBL',
  CROSS = 'CROSS',
  F2L = 'F2L',
  OLL = 'OLL',
  PLL = 'PLL',
  ADVANCED = 'ADVANCED',
}

export enum FormulaStatus {
  NOT_LEARNED = 'NOT_LEARNED',
  LEARNING = 'LEARNING',
  MASTERED = 'MASTERED',
  NEED_REVIEW = 'NEED_REVIEW',
}

export enum Penalty {
  NONE = 'NONE',
  PLUS_TWO = 'PLUS_TWO',
  DNF = 'DNF',
}

export enum TaskType {
  SOLVE_COUNT = 'SOLVE_COUNT',
  AO5_COUNT = 'AO5_COUNT',
  LESSON_COMPLETE = 'LESSON_COMPLETE',
  FORMULA_PRACTICE = 'FORMULA_PRACTICE',
}

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  REGISTERING = 'REGISTERING',
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum MapNodeStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ----- User -----
export interface User {
  id: string;
  role: UserRole;
  phone?: string;
  email?: string;
  nickname: string;
  avatarUrl?: string;
  birthYear?: number;
  city?: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  level: string;
  bestSingleMs?: number;
  bestAo5Ms?: number;
  bestAo12Ms?: number;
  streakDays: number;
  bindCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ----- Course -----
export interface Course {
  id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  category: CourseCategory;
  level?: string;
  isPaid: boolean;
  sortOrder: number;
  published: boolean;
  lessons?: Lesson[];
  progress?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: LessonType;
  content?: string;
  videoUrl?: string;
  formulaText?: string;
  cubeMoves?: string;
  sortOrder: number;
  published: boolean;
}

// ----- Formula -----
export interface Formula {
  id: string;
  name: string;
  category: FormulaCategory;
  caseCode?: string;
  imageUrl?: string;
  moves: string;
  difficulty: number;
  level?: string;
  description?: string;
  commonMistakes?: string;
  sortOrder: number;
  status?: FormulaStatus;
  isFavorite?: boolean;
}

// ----- Solve Result -----
export interface SolveResult {
  id: string;
  userId: string;
  eventType: string;
  scramble: string;
  timeMs: number | null;
  penalty: Penalty;
  finalTimeMs: number | null;
  isPB: boolean;
  note?: string;
  createdAt: string;
}

export interface SolveStats {
  pb: number | null;
  ao5: number | 'DNF' | null;
  ao12: number | 'DNF' | null;
  ao50: number | 'DNF' | null;
  ao100: number | 'DNF' | null;
  totalSolves: number;
  todaySolves: number;
  weekSolves: number;
}

export interface CreateSolveDto {
  eventType: string;
  scramble: string;
  timeMs: number;
  penalty: Penalty;
  note?: string;
}

// ----- Task & Achievement -----
export interface Task {
  id: string;
  title: string;
  type: TaskType;
  targetValue: number;
  rewardExp: number;
  active: boolean;
}

export interface TaskRecord {
  id: string;
  taskId: string;
  task: Task;
  progress: number;
  completed: boolean;
  date: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description?: string;
  iconUrl?: string;
  unlockedAt?: string;
}

// ----- Event -----
export interface Event {
  id: string;
  title: string;
  type?: string;
  city: string;
  address?: string;
  startDate: string;
  endDate?: string;
  registerStart?: string;
  registerEnd?: string;
  registerUrl?: string;
  officialUrl?: string;
  status: EventStatus;
  events?: string;
  description?: string;
}

// ----- Parent -----
export interface ChildSummary {
  childId: string;
  nickname: string;
  avatarUrl?: string;
  bestSingleMs?: number;
  bestAo5Ms?: number;
  todaySolves: number;
  streakDays: number;
  courseProgress: number;
}

// ----- Admin -----
export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalFormulas: number;
  totalResults: number;
  totalEvents: number;
}
