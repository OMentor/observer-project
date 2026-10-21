import 'package:flutter/material.dart';

import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../format.dart';
import '../palette.dart';

/// Подпись времени события: «Весь день» либо «09:00 – 10:30».
String eventTimeLabel(CalendarEvent event) => event.allDay
    ? 'Весь день'
    : formatTimeRange(event.startAt, event.endAt);

/// Единая строка события (цветная метка источника, название, время, место).
///
/// Занятые события маскируются как «Занято» (зеркало `DayDetailPanel.tsx`)
/// и не открываются. Используется в календаре и на экране пространства.
class AppEventTile extends StatelessWidget {
  const AppEventTile({
    super.key,
    required this.event,
    this.color,
    this.onTap,
  });

  final CalendarEvent event;

  /// Цвет источника; по умолчанию — акцент.
  final Color? color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final busy = event.busy;
    final barColor = busy ? appBusyColor : (color ?? c.accent);

    final trailing = <Widget>[
      if (event.hasConflict)
        Semantics(
          label: 'Конфликт синхронизации',
          child: Container(
            key: ValueKey('conflict-dot-${event.id}'),
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: c.danger,
              shape: BoxShape.circle,
            ),
          ),
        ),
      if (event.location != null) ...[
        if (event.hasConflict) const SizedBox(width: AppSpacing.x1),
        Icon(Icons.place_outlined, size: 18, color: c.textSecondary),
      ],
    ];

    return ListTile(
      enabled: !busy && onTap != null,
      leading: Container(
        width: 4,
        height: 40,
        decoration: BoxDecoration(
          color: barColor,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
      title: Text(
        busy ? 'Занято' : event.title,
        style: busy
            ? AppTypography.body.copyWith(
                color: c.textSecondary,
                fontWeight: FontWeight.w500,
              )
            : null,
      ),
      subtitle: Text(eventTimeLabel(event)),
      trailing: trailing.isEmpty
          ? null
          : Row(mainAxisSize: MainAxisSize.min, children: trailing),
      onTap: busy ? null : onTap,
    );
  }
}
