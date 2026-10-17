import 'package:flutter/widgets.dart';

/// Хелперы для системной настройки «уменьшить движение».
///
/// Зеркало web-правила `prefers-reduced-motion: reduce` (см.
/// `web/src/styles/base.css`). Flutter сам сворачивает конечные анимации
/// ([AnimationController] с `AnimationBehavior.normal`) до ~одного кадра, но
/// бесконечные (indeterminate) индикаторы прогресса продолжают вращаться.
/// Этот хелпер используется такими индикаторами, а также любыми собственными
/// анимациями.
abstract final class Motion {
  /// `true`, если в настройках ОС включено уменьшение движения.
  static bool reduce(BuildContext context) =>
      MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  /// Сворачивает длительность анимации в ноль при уменьшенном движении.
  static Duration scale(BuildContext context, Duration duration) =>
      reduce(context) ? Duration.zero : duration;
}

extension MotionBuildContext on BuildContext {
  /// `true`, если включено уменьшение движения (см. [Motion.reduce]).
  bool get reduceMotion => Motion.reduce(this);

  /// Длительность анимации с учётом уменьшения движения (см. [Motion.scale]).
  Duration motionDuration(Duration duration) => Motion.scale(this, duration);
}
