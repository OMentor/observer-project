import 'package:flutter/material.dart';

import '../../core/theme/app_tokens.dart';

/// Тултип (зеркало `web/src/components/ui/tooltip.tsx`). Внешний вид задан
/// `tooltipTheme` (`app_theme.dart`); по умолчанию показывается над потомком.
class AppTooltip extends StatelessWidget {
  const AppTooltip({
    super.key,
    required this.message,
    required this.child,
    this.preferBelow = false,
    this.waitDuration = AppMotion.normal,
  });

  final String message;
  final Widget child;
  final bool preferBelow;
  final Duration waitDuration;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: message,
      preferBelow: preferBelow,
      waitDuration: waitDuration,
      child: child,
    );
  }
}
