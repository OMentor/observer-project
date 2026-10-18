import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Пустое состояние (зеркало `web/src/components/ui/empty-state.tsx`):
/// пунктирная рамка, круглая иконка, заголовок `h4`, описание `body-sm`
/// и необязательное действие.
class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    super.key,
    this.icon,
    required this.title,
    this.description,
    this.action,
    this.iconColor,
    this.padding = const EdgeInsets.symmetric(
      horizontal: AppSpacing.x6,
      vertical: AppSpacing.x12,
    ),
  });

  final Widget? icon;
  final String title;
  final String? description;
  final Widget? action;
  final Color? iconColor;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return CustomPaint(
      painter: _DashedBorderPainter(color: c.border),
      child: Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(
          color: c.bgSurface.withValues(alpha: 0.5),
          borderRadius: AppRadius.allLg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null)
              Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: c.bgElevated,
                  shape: BoxShape.circle,
                ),
                child: IconTheme(
                  data: IconThemeData(color: iconColor ?? c.textMuted, size: 24),
                  child: icon!,
                ),
              ),
            if (icon != null) const SizedBox(height: AppSpacing.x3),
            Text(
              title,
              textAlign: TextAlign.center,
              style: AppTypography.h4.copyWith(color: c.textPrimary),
            ),
            if (description != null) ...[
              const SizedBox(height: AppSpacing.x3),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 384),
                child: Text(
                  description!,
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySmall.copyWith(
                    color: c.textSecondary,
                  ),
                ),
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: AppSpacing.x1 + AppSpacing.x3),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  const _DashedBorderPainter({required this.color});

  static const double _strokeWidth = 1;
  static const double _dash = 6;
  static const double _gap = 4;

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(AppRadius.lg),
    );
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = _strokeWidth;
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final next = math.min(distance + _dash, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + _gap;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorderPainter oldDelegate) =>
      oldDelegate.color != color;
}
