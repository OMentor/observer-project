import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerRequest } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Logo } from '@/components/ui/logo';

const schema = z.object({
  name: z.string().min(1, 'Введите имя'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
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
      const session = await registerRequest(values);
      setSession(session);
      navigate(from ?? '/', { replace: true });
    } catch {
      setServerError('Не удалось зарегистрироваться (возможно, email занят)');
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
          <h1 className="font-serif text-h1 text-text-primary">Регистрация</h1>
          <p className="text-body-sm text-text-secondary">
            Создайте аккаунт в «Плетении»
          </p>
        </div>

        <Field label="Имя" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            error={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
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
          Создать аккаунт
        </Button>

        <p className="text-center text-body-sm text-text-secondary">
          Уже есть аккаунт?{' '}
          <Link to="/login" state={{ from }} className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
