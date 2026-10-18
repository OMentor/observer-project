import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Метка поля (зеркало `web/src/components/ui/label.tsx`):
/// `text-body-sm` (13/18), `font-medium`, цвет `text-secondary`.
class AppLabel extends StatelessWidget {
  const AppLabel({super.key, required this.text, this.required = false});

  final String text;
  final bool required;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Text.rich(
      TextSpan(
        text: text,
        children: required
            ? <InlineSpan>[
                TextSpan(text: ' *', style: TextStyle(color: c.danger)),
              ]
            : null,
      ),
      style: AppTypography.bodySmall.copyWith(
        color: c.textSecondary,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
