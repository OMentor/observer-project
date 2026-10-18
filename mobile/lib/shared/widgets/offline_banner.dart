import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/network/connectivity_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../format.dart';

/// Баннер оффлайн-режима: показывается, когда нет сети. Сообщает, что данные
/// берутся из локального кэша, и когда была последняя успешная синхронизация.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(isOnlineProvider);
    if (online) {
      return const SizedBox.shrink();
    }
    final lastSynced = ref.watch(lastSyncedAtProvider);
    final c = AppColors.of(context);
    return Container(
      width: double.infinity,
      color: c.amberMuted,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.x4,
        vertical: AppSpacing.x2,
      ),
      child: Row(
        children: [
          Icon(Icons.cloud_off, size: 18, color: c.amber),
          const SizedBox(width: AppSpacing.x2),
          Expanded(
            child: Text(
              lastSynced == null
                  ? 'Нет соединения — показаны сохранённые данные'
                  : 'Нет соединения — данные на ${_short(lastSynced)}',
              style: AppTypography.bodySmall.copyWith(color: c.textPrimary),
            ),
          ),
        ],
      ),
    );
  }

  String _short(DateTime value) =>
      '${formatDate(value)}, ${formatTime(value)}';
}
