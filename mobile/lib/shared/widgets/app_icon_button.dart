import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Варианты иконочной кнопки (зеркало `web/src/components/ui/icon-button.tsx`).
enum AppIconButtonVariant { ghost, danger }

/// Иконочная кнопка 36×36 (`size-9`) с обязательной меткой для
/// доступности (используется как tooltip и семантический `label`).
class AppIconButton extends StatelessWidget {
  const AppIconButton({
    super.key,
    required this.icon,
    required this.label,
    this.onPressed,
    this.variant = AppIconButtonVariant.ghost,
    this.iconSize = 20,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final AppIconButtonVariant variant;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final bool danger = variant == AppIconButtonVariant.danger;
    final Color foreground = danger ? c.textMuted : c.textSecondary;
    final Color foregroundHover = danger ? c.danger : c.textPrimary;
    final Color backgroundHover = danger ? c.dangerMuted : c.bgElevated;

    return IconButton(
      onPressed: onPressed,
      iconSize: iconSize,
      tooltip: label,
      icon: Icon(icon),
      style: ButtonStyle(
        minimumSize: const WidgetStatePropertyAll(Size(36, 36)),
        padding: const WidgetStatePropertyAll(EdgeInsets.all(AppSpacing.x2)),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: AppRadius.allMd),
        ),
        overlayColor: const WidgetStatePropertyAll(Colors.transparent),
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) {
            return foreground.withValues(alpha: 0.4);
          }
          if (states.contains(WidgetState.pressed) ||
              states.contains(WidgetState.hovered) ||
              states.contains(WidgetState.focused)) {
            return foregroundHover;
          }
          return foreground;
        }),
        backgroundColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.pressed) ||
                  states.contains(WidgetState.hovered) ||
                  states.contains(WidgetState.focused)
              ? backgroundHover
              : Colors.transparent,
        ),
      ),
    );
  }
}
