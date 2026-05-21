import { registerSchema } from "../../../schemas/userSchema";
import { useRegister } from "../useAuth";
import { useForm } from "../../common/form/useForm";

export const useRegisterForm = (onSuccess?: () => void) => {
  const register = useRegister();

  const form = useForm({
    schema: registerSchema,
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async (values) => {
      await register.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      });
    },
    onSuccess,
  });

  return { ...form, register };
};
