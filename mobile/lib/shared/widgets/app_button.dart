import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import 'app_progress_indicator.dart';

/// Варианты кнопки (зеркало `web/src/components/ui/button.tsx`).
enum AppButtonVariant { primary, secondary, ghost, danger, token }

/// Размеры кнопки: sm `h-8`, md `h-10`, lg `h-12`.
enum AppButtonSize { sm, md, lg }

class _ButtonPalette {
  const _ButtonPalette({
    required this.foreground,
    this.foregroundHover,
    this.background,
    this.backgroundHover,
    this.backgroundActive,
    this.border,
  });

  final Color foreground;
  final Color? foregroundHover;
  final Color? background;
  final Color? backgroundHover;
  final Color? backgroundActive;
  final Color? border;
}

/// Кнопка дизайн-системы: варианты primary/secondary/ghost/danger/token,
/// размеры sm/md/lg, состояние загрузки и растяжение на всю ширину.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.icon,
    this.loading = false,
    this.expanded = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool loading;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final disabled = onPressed == null || loading;

    final double height = switch (size) {
      AppButtonSize.sm => 32,
      AppButtonSize.md => 40,
      AppButtonSize.lg => 48,
    };
    final EdgeInsetsGeometry padding = switch (size) {
      AppButtonSize.sm => const EdgeInsets.symmetric(horizontal: AppSpacing.x3),
      AppButtonSize.md => const EdgeInsets.symmetric(horizontal: AppSpacing.x4),
      AppButtonSize.lg => const EdgeInsets.symmetric(horizontal: AppSpacing.x6),
    };
    final TextStyle textStyle = switch (size) {
      AppButtonSize.sm =>
        AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w500),
      AppButtonSize.md =>
        AppTypography.body.copyWith(fontWeight: FontWeight.w500),
      AppButtonSize.lg =>
        AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w500),
    };
    final double iconSize = size == AppButtonSize.lg ? 18 : 16;

    final palette = _palette(c, variant);
    final Color spinnerColor = disabled
        ? palette.foreground.withValues(alpha: 0.4)
        : palette.foreground;

    final Widget labelText = Text(
      label,
      style: textStyle,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );

    final Widget content = Row(
      mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading) ...[
          SizedBox(
            width: iconSize,
            height: iconSize,
            child: AppProgressIndicator(strokeWidth: 2, color: spinnerColor),
          ),
          const SizedBox(width: AppSpacing.x2),
        ] else if (icon != null) ...[
          Icon(icon, size: iconSize),
          const SizedBox(width: AppSpacing.x2),
        ],
        if (expanded) Flexible(child: labelText) else labelText,
      ],
    );

    final ButtonStyle style = ButtonStyle(
      minimumSize: WidgetStatePropertyAll(Size(0, height)),
      padding: WidgetStatePropertyAll(padding),
      textStyle: WidgetStatePropertyAll(textStyle),
      shape: const WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: AppRadius.allMd),
      ),
      elevation: const WidgetStatePropertyAll(0),
      shadowColor: const WidgetStatePropertyAll(Colors.transparent),
      surfaceTintColor: const WidgetStatePropertyAll(Colors.transparent),
      overlayColor: const WidgetStatePropertyAll(Colors.transparent),
      foregroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) {
          return palette.foreground.withValues(alpha: 0.4);
        }
        if (_hovered(states)) {
          return palette.foregroundHover ?? palette.foreground;
        }
        return palette.foreground;
      }),
      backgroundColor: WidgetStateProperty.resolveWith((states) {
        final Color? base = palette.background;
        if (base == null) {
          final Color? hover = palette.backgroundHover;
          if (hover == null) {
            return Colors.transparent;
          }
          return _hovered(states) ? hover : Colors.transparent;
        }
        if (states.contains(WidgetState.disabled)) {
          return base.withValues(alpha: 0.4);
        }
        if (states.contains(WidgetState.pressed)) {
          return palette.backgroundActive ?? base;
        }
        if (_hovered(states)) {
          return palette.backgroundHover ?? base;
        }
        return base;
      }),
      side: palette.border == null
          ? null
          : WidgetStateProperty.resolveWith(
              (states) => BorderSide(
                color: states.contains(WidgetState.disabled)
                    ? palette.border!.withValues(alpha: 0.4)
                    : palette.border!,
              ),
            ),
    );

    final VoidCallback? onTap = disabled ? null : onPressed;

    final Widget button = switch (variant) {
      AppButtonVariant.primary ||
      AppButtonVariant.danger ||
      AppButtonVariant.token =>
        FilledButton(style: style, onPressed: onTap, child: content),
      AppButtonVariant.secondary =>
        OutlinedButton(style: style, onPressed: onTap, child: content),
      AppButtonVariant.ghost =>
        TextButton(style: style, onPressed: onTap, child: content),
    };

    return expanded ? SizedBox(width: double.infinity, child: button) : button;
  }

  static bool _hovered(Set<WidgetState> states) =>
      states.contains(WidgetState.pressed) ||
      states.contains(WidgetState.hovered) ||
      states.contains(WidgetState.focused);

  static _ButtonPalette _palette(AppColors c, AppButtonVariant variant) {
    return switch (variant) {
      AppButtonVariant.primary => _ButtonPalette(
          foreground: c.onAccent,
          background: c.accent,
          backgroundHover: c.accentHover,
          backgroundActive: c.accentActive,
        ),
      AppButtonVariant.danger => _ButtonPalette(
          foreground: c.onAccent,
          background: c.danger,
          backgroundHover: c.dangerHover,
          backgroundActive: c.dangerActive,
        ),
      AppButtonVariant.token => _ButtonPalette(
          foreground: c.textInverse,
          background: c.amber,
          backgroundHover: c.amberHover,
          backgroundActive: c.amberActive,
        ),
      AppButtonVariant.secondary => _ButtonPalette(
          foreground: c.textPrimary,
          background: c.bgElevated,
          backgroundHover: c.bgElevated,
          backgroundActive: c.bgElevated,
          border: c.border,
        ),
      AppButtonVariant.ghost => _ButtonPalette(
          foreground: c.textSecondary,
          foregroundHover: c.textPrimary,
          backgroundHover: c.bgElevated,
          backgroundActive: c.bgElevated,
        ),
    };
  }
}
