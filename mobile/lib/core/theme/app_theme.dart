import 'package:flutter/material.dart';

/// Токены дизайн-системы «Плетение» — зеркало `web/src/styles/themes.css`.
/// Единственный источник правды для цветов мобильного приложения.
class AppColors {
  const AppColors({
    required this.bg,
    required this.bgSurface,
    required this.bgElevated,
    required this.border,
    required this.borderSubtle,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.textInverse,
    required this.onAccent,
    required this.accent,
    required this.accentHover,
    required this.accentActive,
    required this.accentMuted,
    required this.amber,
    required this.amberHover,
    required this.amberActive,
    required this.amberMuted,
    required this.success,
    required this.successMuted,
    required this.danger,
    required this.dangerHover,
    required this.dangerActive,
    required this.dangerMuted,
  });

  final Color bg;
  final Color bgSurface;
  final Color bgElevated;
  final Color border;
  final Color borderSubtle;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color textInverse;
  final Color onAccent;
  final Color accent;
  final Color accentHover;
  final Color accentActive;
  final Color accentMuted;
  final Color amber;
  final Color amberHover;
  final Color amberActive;
  final Color amberMuted;
  final Color success;
  final Color successMuted;
  final Color danger;
  final Color dangerHover;
  final Color dangerActive;
  final Color dangerMuted;

  /// Тёмный текст на средне-ярких плашках (amber/success).
  static const Color _onTint = Color(0xFF16161A);

  static const AppColors dark = AppColors(
    bg: Color(0xFF1A1A1E),
    bgSurface: Color(0xFF25252B),
    bgElevated: Color(0xFF2E2E35),
    border: Color(0xFF3A3A42),
    borderSubtle: Color(0xFF2E2E35),
    textPrimary: Color(0xFFF5F3EF),
    textSecondary: Color(0xFFA8A29E),
    textMuted: Color(0xFF7D7872),
    textInverse: Color(0xFF1A1A1E),
    onAccent: Color(0xFFFFFFFF),
    accent: Color(0xFF5B5FEF),
    accentHover: Color(0xFF6B6FEF),
    accentActive: Color(0xFF4B4FDF),
    accentMuted: Color.fromRGBO(91, 95, 239, 0.15),
    amber: Color(0xFFF0A030),
    amberHover: Color(0xFFF5B040),
    amberActive: Color(0xFFD98A1F),
    amberMuted: Color.fromRGBO(240, 160, 48, 0.15),
    success: Color(0xFF34C77B),
    successMuted: Color.fromRGBO(52, 199, 123, 0.15),
    danger: Color(0xFFE05C4A),
    dangerHover: Color(0xFFE86C5A),
    dangerActive: Color(0xFFD04C3A),
    dangerMuted: Color.fromRGBO(224, 92, 74, 0.15),
  );

  static const AppColors light = AppColors(
    bg: Color(0xFFFAF8F5),
    bgSurface: Color(0xFFFFFFFF),
    bgElevated: Color(0xFFF0EDE8),
    border: Color(0xFFE0DCD5),
    borderSubtle: Color(0xFFEDEAE4),
    textPrimary: Color(0xFF1A1A1E),
    textSecondary: Color(0xFF6B6660),
    textMuted: Color(0xFF8A837C),
    textInverse: Color(0xFFFAF8F5),
    onAccent: Color(0xFFFFFFFF),
    accent: Color(0xFF4A4EE0),
    accentHover: Color(0xFF5A5EE8),
    accentActive: Color(0xFF3A3ED0),
    accentMuted: Color.fromRGBO(74, 78, 224, 0.1),
    amber: Color(0xFFD98A1F),
    amberHover: Color(0xFFE59A2F),
    amberActive: Color(0xFFC97A0F),
    amberMuted: Color.fromRGBO(217, 138, 31, 0.12),
    success: Color(0xFF2BA865),
    successMuted: Color.fromRGBO(43, 168, 101, 0.12),
    danger: Color(0xFFC94A38),
    dangerHover: Color(0xFFD95A48),
    dangerActive: Color(0xFFB93A28),
    dangerMuted: Color.fromRGBO(201, 74, 56, 0.12),
  );

  ColorScheme toColorScheme(Brightness brightness) {
    return ColorScheme(
      brightness: brightness,
      primary: accent,
      onPrimary: onAccent,
      primaryContainer: accentMuted,
      onPrimaryContainer: textPrimary,
      secondary: amber,
      onSecondary: _onTint,
      secondaryContainer: amberMuted,
      onSecondaryContainer: textPrimary,
      tertiary: success,
      onTertiary: _onTint,
      tertiaryContainer: successMuted,
      onTertiaryContainer: textPrimary,
      error: danger,
      onError: onAccent,
      errorContainer: dangerMuted,
      onErrorContainer: textPrimary,
      surface: bgSurface,
      onSurface: textPrimary,
      onSurfaceVariant: textSecondary,
      surfaceContainerLowest: bg,
      surfaceContainerLow: bg,
      surfaceContainer: bgSurface,
      surfaceContainerHigh: bgElevated,
      surfaceContainerHighest: bgElevated,
      outline: border,
      outlineVariant: borderSubtle,
      inverseSurface: textPrimary,
      onInverseSurface: textInverse,
      inversePrimary: accentHover,
      shadow: const Color(0xFF000000),
      scrim: const Color(0xFF000000),
      surfaceTint: accent,
    );
  }
}

class AppTheme {
  static const String _uiFont = 'Onest';
  static const String _displayFont = 'Lora';

  static ThemeData dark() => _theme(AppColors.dark, Brightness.dark);

  static ThemeData light() => _theme(AppColors.light, Brightness.light);

  static ThemeData _theme(AppColors c, Brightness brightness) {
    final scheme = c.toColorScheme(brightness);
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.bg,
      fontFamily: _uiFont,
    );

    return base.copyWith(
      textTheme: _textTheme(base.textTheme, c),
      appBarTheme: AppBarTheme(
        backgroundColor: c.bg,
        foregroundColor: c.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: _displayFont,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: c.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: c.bgSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: c.borderSubtle),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.bgElevated,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: c.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: c.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: c.accent, width: 1.5),
        ),
        hintStyle: TextStyle(color: c.textMuted),
      ),
      dividerTheme: DividerThemeData(color: c.borderSubtle, space: 1),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.bgElevated,
        contentTextStyle: TextStyle(color: c.textPrimary),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static TextTheme _textTheme(TextTheme base, AppColors c) {
    TextStyle ui(TextStyle? s) => (s ?? const TextStyle()).copyWith(
          fontFamily: _uiFont,
          color: c.textPrimary,
        );
    TextStyle display(TextStyle? s) => (s ?? const TextStyle()).copyWith(
          fontFamily: _displayFont,
          color: c.textPrimary,
        );
    return base.copyWith(
      displayLarge: display(base.displayLarge),
      displayMedium: display(base.displayMedium),
      displaySmall: display(base.displaySmall),
      headlineLarge: display(base.headlineLarge),
      headlineMedium: display(base.headlineMedium),
      headlineSmall: display(base.headlineSmall),
      titleLarge: display(base.titleLarge),
      titleMedium: ui(base.titleMedium),
      titleSmall: ui(base.titleSmall),
      bodyLarge: ui(base.bodyLarge),
      bodyMedium: ui(base.bodyMedium),
      bodySmall: ui(base.bodySmall).copyWith(color: c.textSecondary),
      labelLarge: ui(base.labelLarge),
      labelMedium: ui(base.labelMedium).copyWith(color: c.textSecondary),
      labelSmall: ui(base.labelSmall).copyWith(color: c.textSecondary),
    );
  }
}
