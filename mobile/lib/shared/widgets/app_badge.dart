import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Тона бейджа (зеркало `web/src/components/ui/badge.tsx`).
enum AppBadgeTone { success, accent, amber, danger, muted, neutral }

/// Бейдж: плашка `caption` с подложкой-тоном (`p-2.5/1`, `rounded-lg`).
class AppBadge extends StatelessWidget {
  const AppBadge({
    super.key,
    required this.label,
    this.tone = AppBadgeTone.neutral,
    this.icon,
  });

  final String label;
  final AppBadgeTone tone;

  /// Произвольный значок перед текстом (наследует цвет тона).
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final (Color background, Color foreground) = switch (tone) {
      AppBadgeTone.success => (c.successMuted, c.success),
      AppBadgeTone.accent => (c.accentMuted, c.accent),
      AppBadgeTone.amber => (c.amberMuted, c.amber),
      AppBadgeTone.danger => (c.dangerMuted, c.danger),
      AppBadgeTone.muted => (c.bgElevated, c.textMuted),
      AppBadgeTone.neutral => (c.bgElevated, c.textSecondary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.x2 + 2,
        vertical: AppSpacing.x1,
      ),
      decoration: BoxDecoration(
        color: background,
        borderRadius: AppRadius.allLg,
      ),
      child: DefaultTextStyle(
        style: AppTypography.caption.copyWith(
          color: foreground,
          fontWeight: FontWeight.w500,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              icon!,
              const SizedBox(width: AppSpacing.x1 + 2),
            ],
            Text(label),
          ],
        ),
      ),
    );
  }
}
