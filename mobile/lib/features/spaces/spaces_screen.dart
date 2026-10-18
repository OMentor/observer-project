import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/toast.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_dialogs.dart';
import '../../shared/widgets/app_empty_state.dart';
import '../../shared/widgets/app_error_state.dart';
import '../../shared/widgets/app_list_card.dart';
import '../../shared/widgets/app_loading_state.dart';

class SpacesScreen extends ConsumerWidget {
  const SpacesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spaces = ref.watch(spacesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Пространства')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _createSpace(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Пространство'),
      ),
      body: spaces.when(
        loading: () => const AppLoadingState(),
        error: (error, _) => AppErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(spacesProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.x4),
              children: const [
                SizedBox(height: AppSpacing.x8),
                AppEmptyState(
                  icon: Icon(Icons.grid_view_outlined),
                  title: 'Пока нет пространств',
                  description:
                      'Создайте пространство, чтобы добавлять источники и события.',
                ),
              ],
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(spacesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.x4),
              itemCount: items.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(height: AppSpacing.x2),
              itemBuilder: (context, index) {
                final space = items[index];
                return AppCard(
                  padding: EdgeInsets.zero,
                  child: AppListRow(
                    title: space.name,
                    subtitle: '${space.sources.length} источников',
                    trailing: Icon(
                      Icons.chevron_right,
                      color: AppColors.of(context).textMuted,
                    ),
                    onTap: () => context.go('/spaces/${space.id}'),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _createSpace(BuildContext context, WidgetRef ref) async {
    final name = await showAppPrompt(
      context,
      title: 'Новое пространство',
      label: 'Название',
      confirmLabel: 'Создать',
      validator: (value) => value.isEmpty ? 'Введите название' : null,
    );
    if (name == null || name.isEmpty) {
      return;
    }
    try {
      await ref.read(apiClientProvider).createSpace(name);
      ref.invalidate(spacesProvider);
      ref.invalidate(allEventsProvider);
    } catch (error) {
      ref.read(toastProvider.notifier).push(
            title: 'Не удалось создать пространство',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    }
  }
}
