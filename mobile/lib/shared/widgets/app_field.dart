import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import 'app_label.dart';

/// Поле формы (зеркало `web/src/components/ui/field.tsx`): label + контрол +
/// подсказка/ошибка. Отступ между элементами — 6px (`gap-1.5`).
class AppField extends StatelessWidget {
  const AppField({
    super.key,
    required this.child,
    this.label,
    this.helper,
    this.error,
    this.required = false,
  });

  final Widget child;
  final String? label;
  final String? helper;
  final String? error;
  final bool required;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          AppLabel(text: label!, required: required),
          const SizedBox(height: AppSpacing.x1 + 2),
        ],
        child,
        if (error != null) ...[
          const SizedBox(height: AppSpacing.x1 + 2),
          Text(
            error!,
            style: AppTypography.caption.copyWith(color: c.danger),
          ),
        ] else if (helper != null) ...[
          const SizedBox(height: AppSpacing.x1 + 2),
          Text(
            helper!,
            style: AppTypography.caption.copyWith(color: c.textMuted),
          ),
        ],
      ],
    );
  }
}
