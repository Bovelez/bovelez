import { loginSchema } from '../../../schemas/userSchema';
import { useLogin } from '../useAuth';
import { useForm } from '../../common/form/useForm';

export const useLoginForm = (onSuccess?: () => void) => {
  const login = useLogin();

  const form = useForm({
    schema: loginSchema,
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      await login.mutateAsync({
        email: values.email,
        password: values.password,
      });
    },
    onSuccess,
  });

  return { ...form, login };
};
