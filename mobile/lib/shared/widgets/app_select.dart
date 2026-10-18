import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Пункт выпадающего списка.
class AppSelectItem<T> {
  const AppSelectItem({required this.value, required this.label});

  final T value;
  final String label;
}

/// Выпадающий список (зеркало `web/src/components/ui/select.tsx`).
/// Стиль рамки — из `inputDecorationTheme`; при [error] рамка красная.
class AppSelect<T> extends StatelessWidget {
  const AppSelect({
    super.key,
    required this.items,
    required this.value,
    this.onChanged,
    this.hintText = 'Выберите…',
    this.error = false,
    this.enabled = true,
  });

  final List<AppSelectItem<T>> items;
  final T? value;
  final ValueChanged<T?>? onChanged;
  final String hintText;
  final bool error;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    OutlineInputBorder border(Color color) => OutlineInputBorder(
          borderRadius: AppRadius.allMd,
          borderSide: BorderSide(color: color),
        );

    return DropdownButtonFormField<T>(
      initialValue: value,
      isExpanded: true,
      hint: Text(
        hintText,
        style: AppTypography.body.copyWith(color: c.textMuted),
      ),
      icon: Icon(Icons.keyboard_arrow_down, size: 18, color: c.textMuted),
      dropdownColor: c.bgSurface,
      borderRadius: AppRadius.allMd,
      style: AppTypography.body.copyWith(color: c.textPrimary),
      items: items
          .map(
            (item) => DropdownMenuItem<T>(
              value: item.value,
              child: Text(item.label, overflow: TextOverflow.ellipsis),
            ),
          )
          .toList(),
      onChanged: enabled ? onChanged : null,
      decoration: InputDecoration(
        border: error ? border(c.danger) : null,
        enabledBorder: error ? border(c.danger) : null,
        focusedBorder: error ? border(c.danger) : null,
      ),
    );
  }
}
