import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/realtime/realtime_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Индикатор состояния realtime-соединения (зеркало `ConnectionIndicator`).
class RealtimeIndicator extends ConsumerWidget {
  const RealtimeIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(realtimeStatusProvider);
    final c = AppColors.of(context);
    final (Color color, String label) = switch (status) {
      RealtimeStatus.connected => (c.success, 'Онлайн'),
      RealtimeStatus.connecting => (c.amber, 'Подключение…'),
      RealtimeStatus.disconnected => (c.textMuted, 'Офлайн'),
    };

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.x3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: AppSpacing.x1 + 2),
          Text(label, style: AppTypography.bodySmall.copyWith(color: color)),
        ],
      ),
    );
  }
}
