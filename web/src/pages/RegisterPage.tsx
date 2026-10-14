import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerRequest } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(1, 'Введите имя'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

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
      navigate('/', { replace: true });
    } catch {
      setServerError('Не удалось зарегистрироваться (возможно, email занят)');
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="space-y-1">
          <h1 className="font-serif text-3xl text-text">Регистрация</h1>
          <p className="text-sm text-muted">Создайте аккаунт в «Плетении»</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" {...register('name')} />
          {errors.name && (
            <span className="text-xs text-conflict">{errors.name.message}</span>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && (
            <span className="text-xs text-conflict">{errors.email.message}</span>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && (
            <span className="text-xs text-conflict">
              {errors.password.message}
            </span>
          )}
        </div>

        {serverError && <p className="text-xs text-conflict">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Создание…' : 'Создать аккаунт'}
        </Button>

        <p className="text-center text-sm text-muted">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
