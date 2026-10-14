import 'package:flutter/material.dart';

class AppTheme {
  static const Color _accent = Color(0xFF5B5FEF);
  static const Color _accent2 = Color(0xFFF0A030);

  static const ColorScheme _darkScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: _accent,
    onPrimary: Color(0xFFF5F3EF),
    secondary: _accent2,
    onSecondary: Color(0xFF1A1A1E),
    surface: Color(0xFF25252B),
    onSurface: Color(0xFFF5F3EF),
    error: Color(0xFFE05C4A),
    onError: Color(0xFFF5F3EF),
  );

  static const ColorScheme _lightScheme = ColorScheme(
    brightness: Brightness.light,
    primary: _accent,
    onPrimary: Color(0xFFFFFFFF),
    secondary: _accent2,
    onSecondary: Color(0xFF1A1A1E),
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF1A1A1E),
    error: Color(0xFFE05C4A),
    onError: Color(0xFFFFFFFF),
  );

  static ThemeData dark() => ThemeData(
        useMaterial3: true,
        colorScheme: _darkScheme,
        scaffoldBackgroundColor: const Color(0xFF1A1A1E),
      );

  static ThemeData light() => ThemeData(
        useMaterial3: true,
        colorScheme: _lightScheme,
        scaffoldBackgroundColor: const Color(0xFFFAF8F5),
      );
}
