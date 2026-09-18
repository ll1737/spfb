export function hasVerifiedWorkerAccount(result: any): boolean {
  return Boolean(
    result &&
    result.status === 'ONLINE' &&
    result.isLoggedIn === true &&
    result.account &&
    typeof result.account.encryptedSession === 'string' &&
    result.account.encryptedSession.trim().length > 0
  );
}
