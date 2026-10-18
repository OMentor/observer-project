import 'package:flutter/material.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Карточка (зеркало `web/src/components/ui/card.tsx`): поверхность `bg-surface`,
/// `rounded-lg` (14), тень `shadow-card`; в режиме [interactive] при наведении
/// приподнимается и усиливает тень.
class AppCard extends StatefulWidget {
  const AppCard({
    super.key,
    required this.child,
    this.onTap,
    this.interactive = false,
    this.padding = const EdgeInsets.all(AppSpacing.x5),
    this.color,
    this.gradient,
    this.border,
  });

  final Widget child;
  final VoidCallback? onTap;
  final bool interactive;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final Gradient? gradient;
  final Border? border;

  @override
  State<AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<AppCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final bool lifted = widget.interactive && _hovered;
    final Widget content = Padding(padding: widget.padding, child: widget.child);

    final Widget body = AnimatedContainer(
      duration: context.motionDuration(AppMotion.fast),
      curve: AppMotion.easeOutExpo,
      transform: Matrix4.translationValues(0, lifted ? -2 : 0, 0),
      decoration: BoxDecoration(
        color: widget.gradient == null
            ? (widget.color ?? c.bgSurface)
            : null,
        gradient: widget.gradient,
        borderRadius: AppRadius.allLg,
        border: widget.border,
        boxShadow: lifted ? AppShadows.cardHover : AppShadows.card,
      ),
      child: ClipRRect(
        borderRadius: AppRadius.allLg,
        child: widget.onTap == null
            ? content
            : Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: widget.onTap,
                  borderRadius: AppRadius.allLg,
                  child: content,
                ),
              ),
      ),
    );

    if (!widget.interactive) {
      return body;
    }
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: body,
    );
  }
}
