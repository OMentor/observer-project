import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Чип (зеркало `web/src/components/ui/chip.tsx`): рамка, цветная точка,
/// значок и необязательное удаление.
class AppChip extends StatelessWidget {
  const AppChip({
    super.key,
    required this.label,
    this.color,
    this.icon,
    this.onRemove,
  });

  final String label;
  final Color? color;
  final Widget? icon;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    const double gap = AppSpacing.x1 + 2;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.x2 + 2,
        vertical: AppSpacing.x1,
      ),
      decoration: BoxDecoration(
        color: c.bgElevated,
        border: Border.all(color: c.border),
        borderRadius: AppRadius.allLg,
      ),
      child: DefaultTextStyle(
        style: AppTypography.caption.copyWith(color: c.textPrimary),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (color != null) ...[
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: gap),
            ],
            if (icon != null) ...[
              icon!,
              const SizedBox(width: gap),
            ],
            Text(label),
            if (onRemove != null) ...[
              const SizedBox(width: gap),
              Semantics(
                button: true,
                label: 'Убрать',
                child: GestureDetector(
                  onTap: onRemove,
                  behavior: HitTestBehavior.opaque,
                  child: Icon(Icons.close, size: 12, color: c.textMuted),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
