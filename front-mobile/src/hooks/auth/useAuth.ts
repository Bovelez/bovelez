import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, me, register } from '../../api/auth.api';
import {
  clearToken,
  getToken,
  setToken,
} from '../../storage/auth/auth.storage';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../../types/auth.types';
import { userKeys } from './queryKeys';

export function useUser() {
  return useQuery<User>({
    queryKey: userKeys.me(),
    queryFn: me,
    enabled: !!getToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: ({ token, user }: AuthResponse) => {
      setToken(token);
      queryClient.setQueryData(userKeys.me(), user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
    onSuccess: ({ token, user }: AuthResponse) => {
      setToken(token);
      queryClient.setQueryData(userKeys.me(), user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    clearToken();
    queryClient.clear();
  };
}
