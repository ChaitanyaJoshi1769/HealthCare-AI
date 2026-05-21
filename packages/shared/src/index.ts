import type { ApiResponse } from '@healthos/types';

// Error Handling
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

// API Response Helpers
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(error: AppError): ApiResponse<never> {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

// UUID Generation
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Date Utilities
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Health Data Utilities
export function calculateBMI(weightKg: number, heightM: number): number {
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function interpretBMI(bmi: number): string {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal_weight';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function calculateBMR(weightKg: number, heightCm: number, ageYears: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
}

// Medical Code Utilities
export function normalizeICDCode(code: string): string {
  return code.replace(/\W/g, '').toUpperCase();
}

export function formatICDCode(code: string): string {
  const normalized = normalizeICDCode(code);
  if (normalized.length <= 3) return normalized;
  return `${normalized.substring(0, 3)}.${normalized.substring(3)}`;
}

// Risk Score Utilities
export function calculateRiskPercentile(score: number, population: number[]): number {
  const sorted = population.sort((a, b) => a - b);
  const index = sorted.findIndex((s) => s >= score);
  return Math.round((index / sorted.length) * 100);
}

export function interpretRiskLevel(score: number): 'low' | 'moderate' | 'high' | 'very_high' {
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'very_high';
}

// Confidence Scoring
export function calculateConfidence(factors: { weight: number; confidence: number }[]): number {
  if (factors.length === 0) return 0;
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.weight * f.confidence, 0);
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

// String Utilities
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toPascalCase(str: string): string {
  return str
    .split(/[_-\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

// Validation Utilities
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  return /^\+?[\d\s\-()]{10,}$/.test(phone.replace(/\s/g, ''));
}

// Data Type Guards
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Array Utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

// Pagination Utilities
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

// Deep Object Utilities
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>) as never;
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as never;
    }
  }
  return result;
}

// Async Utilities
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delay?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000 } = options;
  let lastError: Error | undefined;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// Logger
export interface Logger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error | Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, data?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`, data || '');
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  error(message: string, error?: Error | Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, error || '');
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}
