import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/api/api_client.dart';
import '../../core/models.dart';
import '../../core/network/connectivity_service.dart';
import '../../shared/widgets/app_empty_state.dart';
import '../../shared/widgets/app_error_state.dart';
import '../../shared/widgets/app_loading_state.dart';
import 'conflict_card.dart';

/// Список неразрешённых конфликтов. Работает только онлайн: конфликты — это
/// серверное состояние, кэшировать их локально не имеет смысла.
class ConflictsScreen extends ConsumerWidget {
  const ConflictsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(isOnlineProvider);
    final conflicts = ref.watch(conflictsProvider);
    final spaces = ref.watch(spacesProvider).asData?.value ?? const <Space>[];

    final labels = <String, String>{
      for (final space in spaces)
        for (final source in space.sources)
          source.id: '${space.name} / ${source.name}',
    };

    Future<void> refresh() async {
      ref.invalidate(conflictsProvider);
      ref.invalidate(spacesProvider);
      await ref.read(conflictsProvider.future);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Конфликты'),
        actions: [
          IconButton(
            tooltip: 'Обновить',
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(conflictsProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: refresh,
        child: !online
            ? _stateList(
                const AppEmptyState(
                  icon: Icon(Icons.wifi_off),
                  title: 'Нет соединения',
                  description:
                      'Разрешение конфликтов доступно только онлайн. '
                      'Проверьте интернет и потяните вниз, чтобы обновить.',
                ),
              )
            : conflicts.when(
                loading: () => _stateList(
                  const Padding(
                    padding: EdgeInsets.only(top: 120),
                    child: AppLoadingState(label: 'Загружаем конфликты…'),
                  ),
                ),
                error: (error, _) {
                  final network =
                      error is ApiException && error.isNetwork;
                  return _stateList(
                    network
                        ? const AppEmptyState(
                            icon: Icon(Icons.wifi_off),
                            title: 'Нет соединения',
                            description:
                                'Не удалось связаться с сервером. '
                                'Проверьте интернет и попробуйте снова.',
                          )
                        : AppErrorState(
                            message: error.toString(),
                            onRetry: () =>
                                ref.invalidate(conflictsProvider),
                          ),
                  );
                },
                data: (items) {
                  if (items.isEmpty) {
                    return _stateList(
                      const AppEmptyState(
                        icon: Icon(Icons.verified_outlined),
                        title: 'Нет конфликтов',
                        description:
                            'Все изменения синхронизированы с внешними '
                            'календарями.',
                      ),
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final conflict = items[index];
                      return ConflictCard(
                        conflict: conflict,
                        sourceLabel: labels[conflict.event.sourceId],
                        onResolve: () => context.push(
                          '/sync/conflicts/${conflict.id}',
                        ),
                      );
                    },
                  );
                },
              ),
      ),
    );
  }

  Widget _stateList(Widget child) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [const SizedBox(height: 8), child],
    );
  }
}
