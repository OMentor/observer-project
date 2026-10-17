import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/core/theme/app_tokens.dart';

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
    // Заголовки карточек/секций (h4) — Lora, как на Web (`font-serif text-h4`).
    expect(theme.textTheme.titleMedium?.fontFamily, 'Lora');
    expect(theme.textTheme.labelLarge?.fontFamily, 'Onest');
    expect(theme.textTheme.displayLarge?.fontFamily, 'Lora');
    expect(theme.textTheme.headlineMedium?.fontFamily, 'Lora');
    expect(theme.scaffoldBackgroundColor, AppColors.dark.bg);
    expect(theme.appBarTheme.titleTextStyle?.fontFamily, 'Lora');
  });

  test('типографическая шкала соответствует токенам', () {
    final theme = AppTheme.dark();
    expect(theme.textTheme.displayLarge?.fontSize, AppTypography.display.fontSize);
    expect(theme.textTheme.headlineLarge?.fontSize, AppTypography.h1.fontSize);
    expect(theme.textTheme.headlineMedium?.fontSize, AppTypography.h2.fontSize);
    expect(theme.textTheme.headlineSmall?.fontSize, AppTypography.h3.fontSize);
    expect(theme.textTheme.titleMedium?.fontSize, AppTypography.h4.fontSize);
    expect(theme.textTheme.bodyMedium?.fontSize, AppTypography.body.fontSize);
    expect(theme.textTheme.bodySmall?.fontSize, AppTypography.bodySmall.fontSize);
    expect(theme.textTheme.labelSmall?.letterSpacing, AppTypography.overline.letterSpacing);
  });

  test('компоненты Material темизированы из токенов', () {
    final theme = AppTheme.dark();
    final c = AppColors.dark;
    expect(
      theme.inputDecorationTheme.fillColor,
      c.bgSurface,
    );
    expect(
      (theme.inputDecorationTheme.border! as OutlineInputBorder).borderRadius,
      AppRadius.allMd,
    );
    expect(theme.cardTheme.shape, isA<RoundedRectangleBorder>());
    expect(
      (theme.cardTheme.shape! as RoundedRectangleBorder).borderRadius,
      AppRadius.allLg,
    );
    expect(theme.navigationBarTheme.backgroundColor, c.bg);
    expect(theme.dialogTheme.backgroundColor, c.bgSurface);
    expect(
      theme.filledButtonTheme.style?.backgroundColor?.resolve(<WidgetState>{}),
      c.accent,
    );
    expect(
      theme.outlinedButtonTheme.style?.backgroundColor
          ?.resolve(<WidgetState>{}),
      c.bgElevated,
    );
    expect(theme.checkboxTheme.fillColor?.resolve(<WidgetState>{}), c.bgSurface);
    expect(
      theme.checkboxTheme.fillColor?.resolve(<WidgetState>{
        WidgetState.selected,
      }),
      c.accent,
    );
  });
}
