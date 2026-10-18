import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

OutlineInputBorder _border(Color color) => OutlineInputBorder(
      borderRadius: AppRadius.allMd,
      borderSide: BorderSide(color: color),
    );

/// Однострочное текстовое поле (зеркало `web/src/components/ui/input.tsx`).
///
/// Стиль по умолчанию берётся из `inputDecorationTheme`; при [error] рамка
/// становится красной. Подпись/подсказка — на стороне [AppField].
class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    this.controller,
    this.hintText,
    this.error = false,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.onChanged,
    this.onSubmitted,
    this.enabled = true,
    this.prefixIcon,
    this.suffixIcon,
    this.focusNode,
    this.autofillHints,
    this.maxLines = 1,
    this.textCapitalization = TextCapitalization.none,
    this.inputFormatters,
    this.textAlign = TextAlign.start,
    this.autofocus = false,
  });

  final TextEditingController? controller;
  final String? hintText;
  final bool error;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool enabled;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final FocusNode? focusNode;
  final Iterable<String>? autofillHints;
  final int? maxLines;
  final TextCapitalization textCapitalization;
  final List<TextInputFormatter>? inputFormatters;
  final TextAlign textAlign;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      enabled: enabled,
      focusNode: focusNode,
      autofocus: autofocus,
      autofillHints: autofillHints,
      maxLines: maxLines,
      textCapitalization: textCapitalization,
      inputFormatters: inputFormatters,
      textAlign: textAlign,
      decoration: InputDecoration(
        hintText: hintText,
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        border: error ? _border(c.danger) : null,
        enabledBorder: error ? _border(c.danger) : null,
        focusedBorder: error ? _border(c.danger) : null,
      ),
    );
  }
}

/// Многострочное текстовое поле (зеркало `web/src/components/ui/textarea.tsx`).
class AppTextarea extends StatelessWidget {
  const AppTextarea({
    super.key,
    this.controller,
    this.hintText,
    this.error = false,
    this.onChanged,
    this.enabled = true,
    this.minLines = 3,
    this.maxLines,
    this.focusNode,
    this.textInputAction,
  });

  final TextEditingController? controller;
  final String? hintText;
  final bool error;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final int minLines;
  final int? maxLines;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return TextField(
      controller: controller,
      onChanged: onChanged,
      enabled: enabled,
      focusNode: focusNode,
      minLines: minLines,
      maxLines: maxLines,
      keyboardType: TextInputType.multiline,
      textInputAction: textInputAction ?? TextInputAction.newline,
      decoration: InputDecoration(
        hintText: hintText,
        border: error ? _border(c.danger) : null,
        enabledBorder: error ? _border(c.danger) : null,
        focusedBorder: error ? _border(c.danger) : null,
      ),
    );
  }
}
