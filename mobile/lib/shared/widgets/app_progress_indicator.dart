import 'package:flutter/material.dart';

import '../../core/motion/motion.dart';

/// Круглый индикатор прогресса, уважающий «уменьшить движение».
///
/// При включённой системной настройке бесконечный (indeterminate) индикатор
/// заменяется статичной дугой (determinate), чтобы не вращаться. Если [value]
/// задан, поведение не меняется.
class AppProgressIndicator extends StatelessWidget {
  const AppProgressIndicator({
    super.key,
    this.strokeWidth = 4.0,
    this.value,
    this.color,
    this.backgroundColor,
  });

  final double strokeWidth;
  final double? value;
  final Color? color;
  final Color? backgroundColor;

  /// Доля дуги для статичного состояния при уменьшенном движении.
  static const double _reducedMotionValue = 0.75;

  @override
  Widget build(BuildContext context) {
    return CircularProgressIndicator(
      strokeWidth: strokeWidth,
      value: value ?? (context.reduceMotion ? _reducedMotionValue : null),
      color: color,
      backgroundColor: backgroundColor,
    );
  }
}

/// Линейный индикатор прогресса, уважающий «уменьшить движение».
///
/// При включённой системной настройке бесконечный (indeterminate) индикатор
/// заменяется статичной полосой (determinate). Если [value] задан, поведение
/// не меняется.
class AppLinearProgressIndicator extends StatelessWidget {
  const AppLinearProgressIndicator({
    super.key,
    this.value,
    this.color,
    this.backgroundColor,
  });

  final double? value;
  final Color? color;
  final Color? backgroundColor;

  /// Доля полосы для статичного состояния при уменьшенном движении.
  static const double _reducedMotionValue = 0.75;

  @override
  Widget build(BuildContext context) {
    return LinearProgressIndicator(
      value: value ?? (context.reduceMotion ? _reducedMotionValue : null),
      color: color,
      backgroundColor: backgroundColor,
    );
  }
}
