import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import 'app_input.dart';

/// Поле поиска (зеркало `web/src/components/SearchInput.tsx`): иконка лупы
/// слева, подсказка по умолчанию «Поиск…».
class AppSearchInput extends StatelessWidget {
  const AppSearchInput({
    super.key,
    this.controller,
    this.onChanged,
    this.placeholder = 'Поиск…',
    this.focusNode,
    this.autofocus = false,
  });

  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final String placeholder;
  final FocusNode? focusNode;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return AppTextField(
      controller: controller,
      onChanged: onChanged,
      hintText: placeholder,
      focusNode: focusNode,
      autofocus: autofocus,
      textInputAction: TextInputAction.search,
      prefixIcon: Icon(Icons.search, size: 18, color: c.textMuted),
    );
  }
}
