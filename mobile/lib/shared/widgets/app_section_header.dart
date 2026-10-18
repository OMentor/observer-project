import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Заголовок секции: заголовок `h3`, необязательное описание и действие справа.
class AppSectionHeader extends StatelessWidget {
  const AppSectionHeader({
    super.key,
    required this.title,
    this.description,
    this.action,
    this.padding = const EdgeInsets.symmetric(
      horizontal: AppSpacing.x4,
      vertical: AppSpacing.x2,
    ),
  });

  final String title;
  final String? description;
  final Widget? action;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Padding(
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: AppTypography.h4.copyWith(color: c.textPrimary),
                ),
                if (description != null)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.x1),
                    child: Text(
                      description!,
                      style: AppTypography.bodySmall.copyWith(
                        color: c.textSecondary,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (action != null) ...[
            const SizedBox(width: AppSpacing.x3),
            action!,
          ],
        ],
      ),
    );
  }
}
