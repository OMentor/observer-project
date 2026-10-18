import 'package:flutter/material.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Скелетон загрузки (зеркало `web/src/components/ui/skeleton.tsx`):
/// плашка `bg-elevated` с бегущим блеском (`shimmer`). При системном
/// «уменьшить движение» блеск отключается — остаётся статичная плашка.
class AppSkeleton extends StatefulWidget {
  const AppSkeleton({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius,
  });

  final double? width;
  final double height;
  final BorderRadius? borderRadius;

  @override
  State<AppSkeleton> createState() => _AppSkeletonState();
}

class _AppSkeletonState extends State<AppSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final BorderRadius radius = widget.borderRadius ?? AppRadius.allSm;

    if (context.reduceMotion) {
      if (_controller.isAnimating) {
        _controller.stop();
      }
      return _box(c.bgElevated, radius, null);
    }

    if (!_controller.isAnimating) {
      _controller.repeat();
    }
    final Color highlight = Color.alphaBlend(
      Colors.white.withValues(alpha: 0.05),
      c.bgElevated,
    );
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => _box(
        null,
        radius,
        LinearGradient(
          colors: <Color>[c.bgElevated, highlight, c.bgElevated],
          stops: const <double>[0.0, 0.5, 1.0],
          transform: _SlidingGradient(_controller.value),
        ),
      ),
    );
  }

  Widget _box(Color? color, BorderRadius radius, Gradient? gradient) {
    return Container(
      width: widget.width,
      height: widget.height,
      decoration: BoxDecoration(
        color: color,
        gradient: gradient,
        borderRadius: radius,
      ),
    );
  }
}

class _SlidingGradient extends GradientTransform {
  const _SlidingGradient(this.t);

  final double t;

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues((t * 2 - 1) * bounds.width, 0, 0);
  }
}
