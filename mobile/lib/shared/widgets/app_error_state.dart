import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import 'app_button.dart';
import 'app_empty_state.dart';

/// Состояние ошибки: сообщение и необязательное действие «Повторить».
class AppErrorState extends StatelessWidget {
  const AppErrorState({
    super.key,
    required this.message,
    this.title = 'Что-то пошло не так',
    this.onRetry,
    this.retryLabel = 'Повторить',
  });

  final String message;
  final String title;
  final VoidCallback? onRetry;
  final String retryLabel;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return AppEmptyState(
      icon: Icon(Icons.error_outline, color: c.danger),
      iconColor: c.danger,
      title: title,
      description: message,
      action: onRetry == null
          ? null
          : AppButton(
              label: retryLabel,
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.sm,
              onPressed: onRetry,
            ),
    );
  }
}
