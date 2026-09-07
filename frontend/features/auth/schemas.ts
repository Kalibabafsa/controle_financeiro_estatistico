import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    newPassword: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirme a nova senha.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
