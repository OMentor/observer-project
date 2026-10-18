import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_field.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/app_logo.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final isLoading = auth.isLoading;
    final c = AppColors.of(context);

    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.x6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: AppLogo(size: 40, animated: true)),
                const SizedBox(height: AppSpacing.x3),
                Text(
                  'Плетение',
                  textAlign: TextAlign.center,
                  style: AppTypography.h2.copyWith(color: c.textPrimary),
                ),
                const SizedBox(height: AppSpacing.x2),
                Text(
                  'Вход в календарь-планировщик',
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySmall.copyWith(
                    color: c.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.x6),
                AppField(
                  label: 'Email',
                  child: AppTextField(
                    controller: _email,
                    hintText: 'you@example.com',
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                  ),
                ),
                const SizedBox(height: AppSpacing.x3),
                AppField(
                  label: 'Пароль',
                  child: AppTextField(
                    controller: _password,
                    hintText: '••••••••',
                    obscureText: true,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submit(),
                  ),
                ),
                if (auth.hasError) ...[
                  const SizedBox(height: AppSpacing.x3),
                  Text(
                    auth.error.toString(),
                    style: AppTypography.bodySmall.copyWith(color: c.danger),
                  ),
                ],
                const SizedBox(height: AppSpacing.x6),
                AppButton(
                  label: 'Войти',
                  expanded: true,
                  loading: isLoading,
                  onPressed: isLoading ? null : _submit,
                ),
                const SizedBox(height: AppSpacing.x2),
                AppButton(
                  label: 'Нет аккаунта? Зарегистрироваться',
                  variant: AppButtonVariant.ghost,
                  expanded: true,
                  onPressed: () => context.go('/register'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    await ref
        .read(authControllerProvider.notifier)
        .signIn(_email.text.trim(), _password.text);
  }
}
