import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Пункт меню-дропдауна (зеркало `web/src/components/ui/dropdown.tsx`).
class AppDropdownItem {
  const AppDropdownItem({
    required this.label,
    this.icon,
    this.onSelect,
    this.danger = false,
    this.enabled = true,
  });

  final String label;
  final IconData? icon;
  final VoidCallback? onSelect;
  final bool danger;
  final bool enabled;
}

/// Меню-дропдаун: произвольный [trigger] открывает список пунктов.
class AppDropdown extends StatelessWidget {
  const AppDropdown({
    super.key,
    required this.trigger,
    required this.items,
  });

  final Widget trigger;
  final List<AppDropdownItem> items;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return PopupMenuButton<int>(
      tooltip: '',
      padding: EdgeInsets.zero,
      color: c.bgSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: const RoundedRectangleBorder(borderRadius: AppRadius.allLg),
      onSelected: (index) => items[index].onSelect?.call(),
      itemBuilder: (context) => <PopupMenuEntry<int>>[
        for (var i = 0; i < items.length; i++)
          PopupMenuItem<int>(
            value: i,
            enabled: items[i].enabled,
            height: 40,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (items[i].icon != null) ...[
                  Icon(
                    items[i].icon,
                    size: 16,
                    color: items[i].danger ? c.danger : c.textSecondary,
                  ),
                  const SizedBox(width: AppSpacing.x2),
                ],
                Text(
                  items[i].label,
                  style: AppTypography.bodySmall.copyWith(
                    color: items[i].danger ? c.danger : c.textSecondary,
                  ),
                ),
              ],
            ),
          ),
      ],
      child: trigger,
    );
  }
}
