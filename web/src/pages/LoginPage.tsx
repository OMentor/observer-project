import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loginRequest } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Logo } from '@/components/ui/logo';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const from = (location.state as { from?: string } | null)?.from;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const session = await loginRequest(values.email, values.password);
      setSession(session);
      navigate(from ?? '/', { replace: true });
    } catch {
      setServerError('Неверный email или пароль');
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-6 rounded-lg bg-bg-surface p-8 shadow-card"
      >
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <Logo size={40} animated />
          </div>
          <h1 className="font-serif text-h1 text-text-primary">Плетение</h1>
          <p className="text-body-sm text-text-secondary">
            Вход в календарь-планировщик
          </p>
        </div>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            error={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>

        <Field label="Пароль" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            error={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>

        {serverError && <p className="text-caption text-danger">{serverError}</p>}

        <Button type="submit" loading={isSubmitting} className="w-full">
          Войти
        </Button>

        <p className="text-center text-body-sm text-text-secondary">
          Нет аккаунта?{' '}
          <Link to="/register" state={{ from }} className="text-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}
