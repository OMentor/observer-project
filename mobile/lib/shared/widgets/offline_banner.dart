import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/network/connectivity_service.dart';

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
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      color: scheme.secondaryContainer,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Icon(Icons.cloud_off, size: 18, color: scheme.onSecondaryContainer),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              lastSynced == null
                  ? 'Нет соединения — показаны сохранённые данные'
                  : 'Нет соединения — данные на '
                        '${_format(lastSynced)}',
              style: TextStyle(
                color: scheme.onSecondaryContainer,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _format(DateTime value) {
    String two(int v) => v.toString().padLeft(2, '0');
    return '${two(value.day)}.${two(value.month)} '
        '${two(value.hour)}:${two(value.minute)}';
  }
}
