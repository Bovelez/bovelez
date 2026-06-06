import React, { useState } from 'react';
import type { z } from 'zod';
import { handleError } from '../../auth/utils/handlerError';

interface UseFormProps<T extends z.ZodTypeAny> {
  initialValues: z.infer<T>;
  schema: T;
  onSubmit: (values: z.infer<T>) => void | Promise<void>;
  onSuccess?: () => void;
}

export function useForm<T extends z.ZodTypeAny>({
  initialValues,
  schema,
  onSubmit,
  onSuccess,
}: UseFormProps<T>) {
  type Values = z.infer<T>;

  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof Values>(
    field: K,
    value: Values[K],
  ): void;
  function updateField(e: React.ChangeEvent<HTMLInputElement>): void;
  function updateField<K extends keyof Values>(
    fieldOrEvent: K | React.ChangeEvent<HTMLInputElement>,
    value?: Values[K],
  ) {
    if ((fieldOrEvent as React.ChangeEvent<HTMLInputElement>).target) {
      const target = (fieldOrEvent as React.ChangeEvent<HTMLInputElement>)
        .target;
      const id = target.id;
      const val: unknown =
        target.type === 'checkbox' ? target.checked : target.value;

      setValues(
        (prev) =>
          ({
            ...(prev as unknown as Record<string, unknown>),
            [id]: val,
          }) as Values,
      );

      if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }));
      return;
    }

    const field = fieldOrEvent as K;
    setValues(
      (prev) =>
        ({
          ...(prev as unknown as Record<string, unknown>),
          [String(field)]: value,
        }) as Values,
    );
    if (errors[String(field)])
      setErrors((prev) => ({ ...prev, [String(field)]: '' }));
  }

  const validateForm = () => {
    const result = schema.safeParse(values);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setGlobalError(undefined);
    try {
      await onSubmit(values);
      onSuccess?.();
    } catch (err) {
      setGlobalError(handleError(err) || 'Algo salió mal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetValues = (newValues: Values) => {
    setValues(newValues);
    setErrors({});
    setGlobalError(undefined);
  };

  return {
    values,
    errors,
    globalError,
    isSubmitting,
    updateField,
    handleSubmit,
    setGlobalError,
    resetValues,
  };
}
