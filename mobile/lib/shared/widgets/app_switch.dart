import 'package:flutter/material.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Переключатель (зеркало `web/src/components/ui/switch.tsx`): дорожка 40×24,
/// бегунок 16, переход 150ms. При системном «уменьшить движение» — мгновенно.
class AppSwitch extends StatelessWidget {
  const AppSwitch({
    super.key,
    required this.value,
    this.onChanged,
    this.enabled = true,
    this.label,
    this.autofocus = false,
  });

  final bool value;
  final ValueChanged<bool>? onChanged;
  final bool enabled;
  final String? label;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final Duration duration = context.motionDuration(AppMotion.fast);
    final Color track = value ? c.accent : c.bgElevated;
    final Color outline = value ? c.accent : c.border;

    return Semantics(
      container: true,
      toggled: value,
      enabled: enabled,
      label: label,
      child: GestureDetector(
        onTap: enabled ? () => onChanged?.call(!value) : null,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: duration,
          curve: AppMotion.easeOutExpo,
          width: 40,
          height: 24,
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: track,
            borderRadius: AppRadius.allFull,
            border: Border.all(color: outline),
          ),
          child: AnimatedAlign(
            duration: duration,
            curve: AppMotion.easeOutExpo,
            alignment: value ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: c.bgSurface,
                shape: BoxShape.circle,
                boxShadow: AppShadows.card,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
