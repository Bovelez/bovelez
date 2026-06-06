export const portfolioKeys = {
  all: ['portfolio'] as const,
  detail: () => [...portfolioKeys.all, 'detail'] as const,
};
