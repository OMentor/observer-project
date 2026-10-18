import 'dart:ui';

/// Палитра источников (зеркало `web/src/lib/palette.ts`).
const List<Color> appPalette = <Color>[
  Color(0xFF5B5FEF),
  Color(0xFFF0A030),
  Color(0xFF34C77B),
  Color(0xFFE05C4A),
  Color(0xFF8B5CF6),
  Color(0xFF0EA5E9),
];

/// Цвет маскированного события «Занято» (Web `#8D99AE`).
const Color appBusyColor = Color(0xFF8D99AE);

/// Детерминированный цвет метки по имени (тот же хеш, что на Web).
Color colorForName(String name) {
  var hash = 0;
  for (var i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.codeUnitAt(i)) | 0;
  }
  return appPalette[hash.abs() % appPalette.length];
}

/// Инициалы: «Иван Петров» → «ИП», «Иван» → «ИВ», пусто → «?».
String initialsFor(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) {
    return '?';
  }
  String first(String value) =>
      value.isEmpty ? '' : value.substring(0, 1).toUpperCase();
  if (parts.length == 1) {
    final word = parts.first;
    return (word.length <= 2 ? word : word.substring(0, 2)).toUpperCase();
  }
  return '${first(parts.first)}${first(parts.last)}';
}

/// Затемняет цвет (зеркало `darken(hex, 0.65)` из `avatar.tsx`).
Color darkenColor(Color color, [double factor = 0.65]) => Color.from(
      alpha: color.a,
      red: color.r * factor,
      green: color.g * factor,
      blue: color.b * factor,
    );
