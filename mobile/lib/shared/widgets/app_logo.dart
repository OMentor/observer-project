import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_tokens.dart';

/// Знак «Плетение» — решётка из переплетённых нитей (зеркало
/// `web/src/components/ui/logo.tsx` + `logo-strands.ts`).
///
/// Геометрия задана в системе координат 32×32 и масштабируется под [size].
/// При [animated] нити «вплетаются» по очереди (720 мс, каскад 90 мс); при
/// включённом уменьшении движения (см. [Motion.reduce]) решётка сразу показана
/// целиком.
class AppLogo extends StatefulWidget {
  const AppLogo({
    super.key,
    this.size = 32,
    this.animated = false,
    this.semanticLabel = 'Плетение',
  });

  final double size;
  final bool animated;
  final String semanticLabel;

  @override
  State<AppLogo> createState() => _AppLogoState();
}

class _AppLogoState extends State<AppLogo>
    with SingleTickerProviderStateMixin {
  static const int _strandCount = _LogoPainter.strandCount;

  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration:
        AppMotion.weave + _LogoPainter.strandDelay * (_strandCount - 1),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(AppLogo oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  void _sync() {
    if (!widget.animated || context.reduceMotion) {
      _controller.value = 1;
    } else if (!_controller.isAnimating && _controller.value == 0) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: widget.semanticLabel,
      image: true,
      child: SizedBox.square(
        dimension: widget.size,
        child: CustomPaint(
          painter: _LogoPainter(animation: _controller),
          isComplex: true,
        ),
      ),
    );
  }
}

class _LogoPainter extends CustomPainter {
  _LogoPainter({required this.animation}) : super(repaint: animation);

  final Animation<double> animation;

  static const int strandCount = 4;
  static const double _viewBox = 32;
  static const double _strokeWidth = 2.4;
  static const Duration strandDelay = Duration(milliseconds: 90);

  /// Сегменты каждой нити в координатах 32×32: [x1, y1, x2, y2].
  static const List<List<List<double>>> _strands = [
    [
      [12, 6, 12, 10.4],
      [12, 13.6, 12, 26],
    ],
    [
      [20, 6, 20, 18.4],
      [20, 21.6, 20, 26],
    ],
    [
      [6, 12, 18.4, 12],
      [21.6, 12, 26, 12],
    ],
    [
      [6, 20, 10.4, 20],
      [13.6, 20, 26, 20],
    ],
  ];

  static const List<Color> _gradient = [
    Color(0xFF5B5FEF),
    Color(0xFFF0A030),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / _viewBox);

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = _strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..shader = ui.Gradient.linear(
        const Offset(6, 6),
        const Offset(26, 26),
        _gradient,
      );

    final totalMs =
        (AppMotion.weave + strandDelay * (strandCount - 1)).inMilliseconds;
    final elapsed = animation.value * totalMs;

    for (var i = 0; i < _strands.length; i++) {
      final path = _buildPath(_strands[i]);
      final local = (elapsed - strandDelay.inMilliseconds * i) /
          AppMotion.weave.inMilliseconds;
      final t = local.clamp(0.0, 1.0);
      if (t <= 0) {
        continue;
      }
      canvas.drawPath(_partial(path, AppMotion.easeOutExpo.transform(t)), paint);
    }
  }

  static Path _buildPath(List<List<double>> segments) {
    final path = Path();
    for (final segment in segments) {
      path.moveTo(segment[0], segment[1]);
      path.lineTo(segment[2], segment[3]);
    }
    return path;
  }

  /// Обрезает [path] до доли [fraction] от полной длины.
  static Path _partial(Path path, double fraction) {
    if (fraction <= 0) {
      return Path();
    }
    if (fraction >= 1) {
      return path;
    }
    final out = Path();
    var remaining = fraction * _length(path);
    for (final metric in path.computeMetrics()) {
      if (remaining <= 0) {
        break;
      }
      final take = remaining < metric.length ? remaining : metric.length;
      out.addPath(metric.extractPath(0, take), Offset.zero);
      remaining -= take;
    }
    return out;
  }

  static double _length(Path path) {
    var total = 0.0;
    for (final metric in path.computeMetrics()) {
      total += metric.length;
    }
    return total;
  }

  @override
  bool shouldRepaint(_LogoPainter oldDelegate) =>
      oldDelegate.animation != animation;
}
