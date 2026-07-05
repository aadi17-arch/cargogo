const blacklist = new Map<string, number>();

export const addToBlacklist = (token: string, expiresInMs: number = 15 * 60 * 1000) => {
  const expiresAt = Date.now() + expiresInMs;
  blacklist.set(token, expiresAt);
};

export const isBlacklisted = (token: string): boolean => {
  const expiresAt = blacklist.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    blacklist.delete(token);
    return false;
  }
  return true;
};
