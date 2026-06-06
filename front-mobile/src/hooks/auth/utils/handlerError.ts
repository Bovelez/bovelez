export const handleError = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const resp = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response;
    const msg = resp?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message?: string }).message;
  }
  return undefined;
};
