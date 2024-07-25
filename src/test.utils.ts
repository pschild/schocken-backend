import { v4 } from 'uuid';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

export const UUID_V4_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

export const RANDOM_UUID = v4();
