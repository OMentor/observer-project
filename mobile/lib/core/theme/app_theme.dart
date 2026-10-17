import 'package:flutter/material.dart';

import 'app_tokens.dart';

/// Токены дизайн-системы «Плетение» — зеркало `web/src/styles/themes.css`.
/// Единственный источник правды для цветов мобильного приложения.
/// Нецветовые токены (шрифты, сетка, радиусы, тени, шкала) — в `app_tokens.dart`.
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

/// Тема приложения: связывает токены ([AppColors], [AppTypography], …) с
/// Material-компонентами. Компоненты делятся на «базовые» (получают стиль из
/// темы) и примитивы DS (`lib/shared/widgets/`, переопределяют стиль точечно).
class AppTheme {
  static ThemeData dark() => _theme(AppColors.dark, Brightness.dark);

  static ThemeData light() => _theme(AppColors.light, Brightness.light);

  static ThemeData _theme(AppColors c, Brightness brightness) {
    final scheme = c.toColorScheme(brightness);
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: c.bg,
      fontFamily: AppFonts.ui,
    );

    return base.copyWith(
      textTheme: _textTheme(base, c),
      appBarTheme: AppBarTheme(
        backgroundColor: c.bg,
        foregroundColor: c.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: AppTypography.h3.copyWith(color: c.textPrimary),
        iconTheme: IconThemeData(color: c.textSecondary),
        actionsIconTheme: IconThemeData(color: c.textSecondary),
      ),
      iconTheme: IconThemeData(color: c.textSecondary),
      cardTheme: CardThemeData(
        color: c.bgSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.allLg),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.bgSurface,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.x4,
          vertical: 10,
        ),
        border: _inputBorder(c.border),
        enabledBorder: _inputBorder(c.border),
        disabledBorder: _inputBorder(c.border.withValues(alpha: 0.4)),
        focusedBorder: _inputBorder(c.accent),
        errorBorder: _inputBorder(c.danger),
        focusedErrorBorder: _inputBorder(c.danger),
        hintStyle: AppTypography.body.copyWith(color: c.textMuted),
        labelStyle: AppTypography.bodySmall.copyWith(color: c.textSecondary),
        errorStyle: AppTypography.caption.copyWith(color: c.danger),
        helperStyle: AppTypography.caption.copyWith(color: c.textMuted),
        floatingLabelStyle: AppTypography.bodySmall.copyWith(color: c.accent),
      ),
      checkboxTheme: CheckboxThemeData(
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.allSm),
        side: BorderSide(color: c.border),
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? c.accent
              : c.bgSurface,
        ),
        checkColor: WidgetStatePropertyAll(c.onAccent),
        overlayColor: WidgetStatePropertyAll(c.accentMuted),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStatePropertyAll(c.bgSurface),
        trackColor: WidgetStateProperty.resolveWith(
          (states) =>
              states.contains(WidgetState.selected) ? c.accent : c.bgElevated,
        ),
        trackOutlineColor: WidgetStateProperty.resolveWith(
          (states) =>
              states.contains(WidgetState.selected) ? c.accent : c.border,
        ),
        overlayColor: WidgetStatePropertyAll(c.accentMuted),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: c.bg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 64,
        indicatorColor: c.accentMuted,
        indicatorShape: const RoundedRectangleBorder(
          borderRadius: AppRadius.allMd,
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => AppTypography.caption.copyWith(
            fontWeight: FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? c.textPrimary
                : c.textSecondary,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 22,
            color: states.contains(WidgetState.selected)
                ? c.accent
                : c.textSecondary,
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.bgSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.allXl),
        titleTextStyle: AppTypography.h2.copyWith(color: c.textPrimary),
        contentTextStyle: AppTypography.bodySmall.copyWith(
          color: c.textSecondary,
        ),
        barrierColor: Colors.black.withValues(alpha: 0.6),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.bgSurface,
        modalBackgroundColor: c.bgSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        modalElevation: 0,
        showDragHandle: false,
        dragHandleColor: c.border,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.topXl),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: c.textSecondary,
        textColor: c.textPrimary,
        titleTextStyle: AppTypography.body.copyWith(
          color: c.textPrimary,
          fontWeight: FontWeight.w500,
        ),
        subtitleTextStyle: AppTypography.bodySmall.copyWith(
          color: c.textSecondary,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.x4),
        minVerticalPadding: AppSpacing.x2,
      ),
      expansionTileTheme: ExpansionTileThemeData(
        textColor: c.textPrimary,
        collapsedTextColor: c.textPrimary,
        iconColor: c.textSecondary,
        collapsedIconColor: c.textSecondary,
        backgroundColor: Colors.transparent,
        collapsedBackgroundColor: Colors.transparent,
        shape: const Border(),
        collapsedShape: const Border(),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? c.accentMuted
                : Colors.transparent,
          ),
          foregroundColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? c.accent
                : c.textSecondary,
          ),
          side: WidgetStateProperty.resolveWith(
            (states) => BorderSide(
              color: states.contains(WidgetState.selected)
                  ? c.accent
                  : c.border,
            ),
          ),
          textStyle: WidgetStatePropertyAll(
            AppTypography.body.copyWith(fontWeight: FontWeight.w500),
          ),
          shape: const WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: AppRadius.allMd),
          ),
        ),
      ),
      dropdownMenuTheme: DropdownMenuThemeData(menuStyle: _menuStyle(c)),
      popupMenuTheme: PopupMenuThemeData(
        color: c.bgSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.allLg),
        textStyle: AppTypography.bodySmall.copyWith(color: c.textPrimary),
        position: PopupMenuPosition.over,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: c.bgElevated,
        surfaceTintColor: Colors.transparent,
        side: BorderSide(color: c.border),
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.allLg),
        labelStyle: AppTypography.caption.copyWith(color: c.textPrimary),
        labelPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.x1),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.x2,
          vertical: AppSpacing.x1,
        ),
        deleteIconColor: c.textMuted,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: c.bgElevated,
          border: Border.all(color: c.border),
          borderRadius: AppRadius.allMd,
        ),
        textStyle: AppTypography.caption.copyWith(color: c.textPrimary),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.x2,
          vertical: AppSpacing.x1,
        ),
        waitDuration: AppMotion.normal,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.accent,
        linearTrackColor: c.bgElevated,
        circularTrackColor: Colors.transparent,
        linearMinHeight: 4,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.bgElevated,
        contentTextStyle: AppTypography.bodySmall.copyWith(color: c.textPrimary),
        actionTextColor: c.accent,
        behavior: SnackBarBehavior.floating,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.allMd),
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: c.accent,
        selectionColor: c.accentMuted,
        selectionHandleColor: c.accent,
      ),
      dividerTheme: DividerThemeData(
        color: c.borderSubtle,
        thickness: 1,
        space: 1,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: c.accent,
        foregroundColor: c.onAccent,
        elevation: 0,
        focusElevation: 0,
        hoverElevation: 0,
        highlightElevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.allLg),
      ),
      filledButtonTheme: FilledButtonThemeData(style: _filled(c)),
      elevatedButtonTheme: ElevatedButtonThemeData(style: _filled(c)),
      outlinedButtonTheme: OutlinedButtonThemeData(style: _outlined(c)),
      textButtonTheme: TextButtonThemeData(style: _ghost(c)),
      iconButtonTheme: IconButtonThemeData(style: _iconButton(c)),
    );
  }

  static OutlineInputBorder _inputBorder(Color color) => OutlineInputBorder(
        borderRadius: AppRadius.allMd,
        borderSide: BorderSide(color: color),
      );

  static MenuStyle _menuStyle(AppColors c) => MenuStyle(
        backgroundColor: WidgetStatePropertyAll(c.bgSurface),
        surfaceTintColor: const WidgetStatePropertyAll(Colors.transparent),
        elevation: const WidgetStatePropertyAll(0),
        shadowColor: const WidgetStatePropertyAll(Colors.transparent),
        padding: const WidgetStatePropertyAll(
          EdgeInsets.symmetric(vertical: AppSpacing.x1),
        ),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: AppRadius.allLg),
        ),
      );

  /// Нажатие/наведение/фокус — состояния «активного» ховера.
  static bool _active(Set<WidgetState> states) =>
      states.contains(WidgetState.pressed) ||
      states.contains(WidgetState.hovered) ||
      states.contains(WidgetState.focused);

  static WidgetStateProperty<TextStyle> get _buttonText =>
      WidgetStatePropertyAll(
        AppTypography.body.copyWith(fontWeight: FontWeight.w500),
      );

  static const WidgetStateProperty<Size> _buttonSize =
      WidgetStatePropertyAll(Size(0, 40));

  static const WidgetStateProperty<EdgeInsetsGeometry> _buttonPadding =
      WidgetStatePropertyAll(EdgeInsets.symmetric(horizontal: AppSpacing.x4));

  static const WidgetStateProperty<OutlinedBorder> _buttonShape =
      WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: AppRadius.allMd),
      );

  static ButtonStyle _filled(AppColors c) => ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) {
            return c.accent.withValues(alpha: 0.4);
          }
          if (states.contains(WidgetState.pressed)) {
            return c.accentActive;
          }
          if (states.contains(WidgetState.hovered) ||
              states.contains(WidgetState.focused)) {
            return c.accentHover;
          }
          return c.accent;
        }),
        foregroundColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.disabled)
              ? c.onAccent.withValues(alpha: 0.4)
              : c.onAccent,
        ),
        overlayColor: const WidgetStatePropertyAll(Colors.transparent),
        shadowColor: const WidgetStatePropertyAll(Colors.transparent),
        surfaceTintColor: const WidgetStatePropertyAll(Colors.transparent),
        elevation: const WidgetStatePropertyAll(0),
        textStyle: _buttonText,
        minimumSize: _buttonSize,
        padding: _buttonPadding,
        shape: _buttonShape,
      );

  static ButtonStyle _outlined(AppColors c) => ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.disabled)
              ? c.bgElevated.withValues(alpha: 0.4)
              : c.bgElevated,
        ),
        foregroundColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.disabled)
              ? c.textPrimary.withValues(alpha: 0.4)
              : c.textPrimary,
        ),
        overlayColor: const WidgetStatePropertyAll(Colors.transparent),
        side: WidgetStateProperty.resolveWith(
          (states) => BorderSide(
            color: states.contains(WidgetState.disabled)
                ? c.border.withValues(alpha: 0.4)
                : c.border,
          ),
        ),
        elevation: const WidgetStatePropertyAll(0),
        textStyle: _buttonText,
        minimumSize: _buttonSize,
        padding: _buttonPadding,
        shape: _buttonShape,
      );

  static ButtonStyle _ghost(AppColors c) => ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith(
          (states) => _active(states) ? c.bgElevated : Colors.transparent,
        ),
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) {
            return c.textSecondary.withValues(alpha: 0.4);
          }
          return _active(states) ? c.textPrimary : c.textSecondary;
        }),
        overlayColor: const WidgetStatePropertyAll(Colors.transparent),
        elevation: const WidgetStatePropertyAll(0),
        textStyle: _buttonText,
        minimumSize: _buttonSize,
        padding: _buttonPadding,
        shape: _buttonShape,
      );

  static ButtonStyle _iconButton(AppColors c) => ButtonStyle(
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) {
            return c.textSecondary.withValues(alpha: 0.4);
          }
          return _active(states) ? c.textPrimary : c.textSecondary;
        }),
        backgroundColor: WidgetStateProperty.resolveWith(
          (states) => _active(states) ? c.bgElevated : Colors.transparent,
        ),
        overlayColor: const WidgetStatePropertyAll(Colors.transparent),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: AppRadius.allMd),
        ),
        minimumSize: const WidgetStatePropertyAll(Size(36, 36)),
        padding: const WidgetStatePropertyAll(EdgeInsets.all(AppSpacing.x2)),
      );

  static TextTheme _textTheme(ThemeData base, AppColors c) {
    TextStyle primary(TextStyle s) => s.copyWith(color: c.textPrimary);
    TextStyle secondary(TextStyle s) => s.copyWith(color: c.textSecondary);
    return base.textTheme.copyWith(
      displayLarge: primary(AppTypography.display),
      displayMedium: primary(AppTypography.h1),
      displaySmall: primary(AppTypography.h2),
      headlineLarge: primary(AppTypography.h1),
      headlineMedium: primary(AppTypography.h2),
      headlineSmall: primary(AppTypography.h3),
      titleLarge: primary(AppTypography.h3),
      titleMedium: primary(AppTypography.h4),
      titleSmall: primary(
        AppTypography.body.copyWith(fontWeight: FontWeight.w500),
      ),
      bodyLarge: primary(AppTypography.bodyLarge),
      bodyMedium: primary(AppTypography.body),
      bodySmall: secondary(AppTypography.bodySmall),
      labelLarge: primary(
        AppTypography.body.copyWith(fontWeight: FontWeight.w500),
      ),
      labelMedium: secondary(
        AppTypography.caption.copyWith(fontWeight: FontWeight.w500),
      ),
      labelSmall: secondary(AppTypography.overline),
    );
  }
}
