import { mockDeep, MockType } from 'vitest-mock-extended';

export function createMock<T>(): MockType<T> {
  return mockDeep<T>();
}