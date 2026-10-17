import 'package:flutter/widgets.dart';

/// Нецветовые токены дизайн-системы «Плетение» — зеркало `web/src/index.css`
/// (`@theme inline`) и `docs/design.md` §3–4. Цвета — в [AppColors]
/// (`app_theme.dart`). Здесь: шрифты, шаг сетки, радиусы, тени, движение и
/// типографическая шкала.

/// Семейства шрифтов. Зеркало `--font-sans/serif/mono`.
///
/// `JetBrains Mono` в мобильном приложении не забандлен (в `pubspec.yaml` только
/// Onest и Lora), поэтому у моно-стиля задан системный fallback `monospace`.
abstract final class AppFonts {
  static const String ui = 'Onest';
  static const String display = 'Lora';
  static const String mono = 'JetBrains Mono';
  static const List<String> monoFallback = <String>['monospace'];
}

/// Базовый шаг сетки — 4px (Tailwind `1` = 4px). Зеркало `docs/design.md` §4.
abstract final class AppSpacing {
  static const double x1 = 4;
  static const double x2 = 8;
  static const double x3 = 12;
  static const double x4 = 16;
  static const double x5 = 20;
  static const double x6 = 24;
  static const double x8 = 32;
  static const double x10 = 40;
  static const double x12 = 48;
}

/// Радиусы скругления. Зеркало `--radius-*` (`web/src/index.css`).
abstract final class AppRadius {
  static const double sm = 6;
  static const double md = 10;
  static const double lg = 14;
  static const double xl = 20;
  static const double full = 9999;

  static const BorderRadius allSm = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius allMd = BorderRadius.all(Radius.circular(md));
  static const BorderRadius allLg = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius allXl = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius allFull = BorderRadius.all(Radius.circular(full));

  /// Верхнее скругление (нижние листы, дроверы).
  static const BorderRadius topXl = BorderRadius.vertical(
    top: Radius.circular(xl),
  );
}

/// Тени. Зеркало `--shadow-*` (`web/src/index.css`).
abstract final class AppShadows {
  /// `0 1px 2px rgba(0, 0, 0, 0.3)`.
  static const List<BoxShadow> card = <BoxShadow>[
    BoxShadow(color: Color(0x4D000000), blurRadius: 2, offset: Offset(0, 1)),
  ];

  /// `0 4px 12px rgba(0, 0, 0, 0.4)`.
  static const List<BoxShadow> cardHover = <BoxShadow>[
    BoxShadow(color: Color(0x66000000), blurRadius: 12, offset: Offset(0, 4)),
  ];

  /// `0 12px 32px rgba(0, 0, 0, 0.5)`.
  static const List<BoxShadow> modal = <BoxShadow>[
    BoxShadow(color: Color(0x80000000), blurRadius: 32, offset: Offset(0, 12)),
  ];

  /// `0 8px 24px rgba(0, 0, 0, 0.4)`.
  static const List<BoxShadow> dropdown = <BoxShadow>[
    BoxShadow(color: Color(0x66000000), blurRadius: 24, offset: Offset(0, 8)),
  ];

  /// Цвет фокус-ринга: `rgba(91, 95, 239, 0.2)` (не зависит от темы).
  static const Color focusRingColor = Color(0x335B5FEF);

  /// Фокус-ринг: `0 0 0 3px rgba(91, 95, 239, 0.2)`.
  static const List<BoxShadow> focus = <BoxShadow>[
    BoxShadow(color: focusRingColor, spreadRadius: 3),
  ];

  /// Фокус-ринг с произвольным цветом (например, `accentMuted`).
  static List<BoxShadow> focusRing(Color color) => <BoxShadow>[
    BoxShadow(color: color, spreadRadius: 3),
  ];
}

/// Длительности и кривые анимаций. Зеркало `--ease-*` и `--animate-*`.
///
/// Для учёта системной настройки «уменьшить движение» длительности пропускайте
/// через `Motion`/`context.motionDuration` (`core/motion/motion.dart`).
abstract final class AppMotion {
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 250);
  static const Duration weave = Duration(milliseconds: 720);

  /// `cubic-bezier(0.4, 0, 0.2, 1)`.
  static const Curve easeOutExpo = Cubic(0.4, 0.0, 0.2, 1.0);

  /// `cubic-bezier(0.34, 1.56, 0.64, 1)`.
  static const Curve spring = Cubic(0.34, 1.56, 0.64, 1.0);
}

/// Типографическая шкала. Зеркало `--text-*` (`web/src/index.css`) и
/// `docs/design.md` §3. Цвет не задан — применяется темой/вызывающим кодом.
///
/// Насыщенности: 400 (основной), 500 (акцентный), 600 (заголовки, overline).
abstract final class AppTypography {
  static const TextStyle display = TextStyle(
    fontFamily: AppFonts.display,
    fontSize: 48,
    height: 56 / 48,
    letterSpacing: -0.96,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle h1 = TextStyle(
    fontFamily: AppFonts.display,
    fontSize: 32,
    height: 40 / 32,
    letterSpacing: -0.32,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle h2 = TextStyle(
    fontFamily: AppFonts.display,
    fontSize: 24,
    height: 32 / 24,
    letterSpacing: -0.24,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle h3 = TextStyle(
    fontFamily: AppFonts.display,
    fontSize: 20,
    height: 28 / 20,
    letterSpacing: -0.2,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle h4 = TextStyle(
    fontFamily: AppFonts.display,
    fontSize: 16,
    height: 24 / 16,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontFamily: AppFonts.ui,
    fontSize: 16,
    height: 24 / 16,
  );

  static const TextStyle body = TextStyle(
    fontFamily: AppFonts.ui,
    fontSize: 14,
    height: 20 / 14,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily: AppFonts.ui,
    fontSize: 13,
    height: 18 / 13,
  );

  static const TextStyle caption = TextStyle(
    fontFamily: AppFonts.ui,
    fontSize: 12,
    height: 16 / 12,
    letterSpacing: 0.12,
  );

  static const TextStyle overline = TextStyle(
    fontFamily: AppFonts.ui,
    fontSize: 11,
    height: 16 / 11,
    letterSpacing: 0.88,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle mono = TextStyle(
    fontFamily: AppFonts.mono,
    fontFamilyFallback: AppFonts.monoFallback,
    fontSize: 13,
    height: 18 / 13,
  );
}
