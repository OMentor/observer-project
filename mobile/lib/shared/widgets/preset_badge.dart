import 'package:flutter/material.dart';

import '../../core/models.dart';
import 'app_badge.dart';

/// Бейдж пресета доступа (зеркало `web/src/components/ui/preset-badge.tsx`).
class PresetBadge extends StatelessWidget {
  const PresetBadge({super.key, required this.preset});

  final String preset;

  @override
  Widget build(BuildContext context) {
    final (String label, AppBadgeTone tone, String glyph) = switch (preset) {
      Preset.full => ('Полный', AppBadgeTone.success, '●'),
      Preset.own => ('Свои', AppBadgeTone.accent, '◐'),
      Preset.busy => ('Занят', AppBadgeTone.amber, '◌'),
      Preset.read => ('Чтение', AppBadgeTone.muted, '○'),
      _ => (Preset.label(preset), AppBadgeTone.neutral, '○'),
    };
    return AppBadge(
      label: label,
      tone: tone,
      icon: Text(glyph, style: const TextStyle(fontSize: 10, height: 1.2)),
    );
  }
}
