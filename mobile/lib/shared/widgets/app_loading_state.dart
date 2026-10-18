import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import 'app_progress_indicator.dart';

/// Состояние загрузки: центрированный спиннер с необязательной подписью.
class AppLoadingState extends StatelessWidget {
  const AppLoadingState({
    super.key,
    this.label,
    this.padding = const EdgeInsets.all(AppSpacing.x6),
  });

  final String? label;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Center(
      child: Padding(
        padding: padding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AppProgressIndicator(),
            if (label != null) ...[
              const SizedBox(height: AppSpacing.x3),
              Text(
                label!,
                style: AppTypography.bodySmall.copyWith(color: c.textSecondary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
