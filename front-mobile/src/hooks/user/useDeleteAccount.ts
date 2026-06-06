import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAccount } from '../../api/user.api';
import { clearToken } from '../../storage/auth/auth.storage';
import type { DeleteAccountCredentials } from '../../types/user.types';

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: DeleteAccountCredentials) =>
      deleteAccount(credentials),
    onSuccess: () => {
      clearToken();
      queryClient.clear();
    },
  });
}
