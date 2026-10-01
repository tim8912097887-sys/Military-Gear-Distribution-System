export function isLockNotAvailableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  // Check direct error code (for raw pg errors)
  if ('code' in error && error.code === '55P03') {
    return true;
  }

  // Check nested cause property (for DrizzleQueryError / wrapped errors)
  if ('cause' in error && typeof error.cause === 'object' && error.cause !== null) {
    return 'code' in error.cause && error.cause.code === '55P03';
  }

  return false;
}
