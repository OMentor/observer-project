import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pletenie_mobile/core/theme/app_theme.dart';

void main() {
  test('тёмная схема выводится из токенов', () {
    final scheme = AppTheme.dark().colorScheme;
    expect(scheme.brightness, Brightness.dark);
    expect(scheme.primary, AppColors.dark.accent);
    expect(scheme.surface, AppColors.dark.bgSurface);
    expect(scheme.outline, AppColors.dark.border);
    expect(scheme.error, AppColors.dark.danger);
    expect(scheme.secondary, AppColors.dark.amber);
  });

  test('светлая схема выводится из токенов', () {
    final scheme = AppTheme.light().colorScheme;
    expect(scheme.brightness, Brightness.light);
    expect(scheme.primary, AppColors.light.accent);
    expect(scheme.surface, AppColors.light.bgSurface);
    expect(scheme.outline, AppColors.light.border);
  });

  test('шрифты: Onest для интерфейса, Lora для заголовков', () {
    final theme = AppTheme.dark();
    expect(theme.textTheme.bodyMedium?.fontFamily, 'Onest');
    expect(theme.textTheme.titleMedium?.fontFamily, 'Onest');
    expect(theme.textTheme.labelLarge?.fontFamily, 'Onest');
    expect(theme.textTheme.displayLarge?.fontFamily, 'Lora');
    expect(theme.textTheme.headlineMedium?.fontFamily, 'Lora');
    expect(theme.scaffoldBackgroundColor, AppColors.dark.bg);
    expect(theme.appBarTheme.titleTextStyle?.fontFamily, 'Lora');
  });
}
