import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_field.dart';
import '../../shared/widgets/app_input.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
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
      appBar: AppBar(title: const Text('Регистрация')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.x6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppField(
                  label: 'Имя',
                  child: AppTextField(
                    controller: _name,
                    hintText: 'Как вас показывать участникам',
                  ),
                ),
                const SizedBox(height: AppSpacing.x3),
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
                    hintText: 'Придумайте пароль',
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
                  label: 'Создать аккаунт',
                  expanded: true,
                  loading: isLoading,
                  onPressed: isLoading ? null : _submit,
                ),
                const SizedBox(height: AppSpacing.x2),
                AppButton(
                  label: 'Уже есть аккаунт? Войти',
                  variant: AppButtonVariant.ghost,
                  expanded: true,
                  onPressed: () => context.go('/login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    await ref.read(authControllerProvider.notifier).register(
          _name.text.trim(),
          _email.text.trim(),
          _password.text,
        );
  }
}
