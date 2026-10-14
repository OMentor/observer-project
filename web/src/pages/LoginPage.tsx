import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    setSession({ accessToken: 'stub', user: { email: values.email } });
    navigate('/');
  };

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-text">Плетение</h1>
          <p className="text-sm text-muted">Вход в календарь-планировщик</p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            {...register('email')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          {errors.email && (
            <span className="text-xs text-conflict">{errors.email.message}</span>
          )}
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-muted">Пароль</span>
          <input
            type="password"
            {...register('password')}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          {errors.password && (
            <span className="text-xs text-conflict">
              {errors.password.message}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
