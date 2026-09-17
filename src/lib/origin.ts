export const LOCAL_HOST_REGEX =
  '^(localhost|127\\.0\\.0\\.1|\\[::1\\]|0\\.0\\.0\\.0)(:\\d+)?$|\\.localhost(:\\d+)?$';

export const ORIGIN_COLORS = {
  local: '#f59e0b',
  you: '#22c55e',
  external: '#3b82f6',
};

export type Origin = keyof typeof ORIGIN_COLORS;

export const isLocalHost = (host?: string) => new RegExp(LOCAL_HOST_REGEX).test(host || '');

export const isGoogle = (domain?: string) => /(^|\.)google\.[a-z.]+$/.test(domain || '');
