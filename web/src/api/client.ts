import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function snakeToCamelKey(key: string): string {
  const leading = key.match(/^_+/)?.[0] ?? '';
  const rest = key.slice(leading.length);
  return leading + rest.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function toCamelCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => toCamelCase(v)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [snakeToCamelKey(k), toCamelCase(v)]),
    ) as T;
  }
  return value;
}

export async function unwrap<T>(promise: PromiseLike<{ data: unknown; error: unknown }>): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    throw await toApiError(error);
  }
  return toCamelCase(data) as T;
}

async function toApiError(error: unknown): Promise<ApiError> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = await context.clone().json();
        return new ApiError(body.message ?? `Erro ${context.status}`, context.status);
      } catch {
        return new ApiError(`Erro ${context.status}`, context.status);
      }
    }
  }
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message: unknown }).message)
    : 'Erro desconhecido';
  return new ApiError(message, 400);
}
