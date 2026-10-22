import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/access.dart';
import '../../shared/hex_color.dart';
import '../../shared/toast.dart';
import '../../shared/widgets/app_badge.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_dialogs.dart';
import '../../shared/widgets/app_empty_state.dart';
import '../../shared/widgets/app_error_state.dart';
import '../../shared/widgets/app_event_tile.dart';
import '../../shared/widgets/app_loading_state.dart';
import '../events/event_form_sheet.dart';

class SpaceScreen extends ConsumerWidget {
  const SpaceScreen({super.key, required this.spaceId});

  final String spaceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spaceAsync = ref.watch(spaceProvider(spaceId));
    final sources = spaceAsync.asData?.value.sources ?? const <Source>[];
    final preset = ref.watch(spacePresetProvider(spaceId)).asData?.value;
    final isFull = Access.isFull(preset);
    final canCreateEvents = Access.canWriteEvents(preset);
    final me = ref.watch(authControllerProvider).asData?.value?.id;
    final space = spaceAsync.asData?.value;
    final isOwner = space != null && space.ownerId == me;

    return Scaffold(
      appBar: AppBar(
        title: Text(spaceAsync.asData?.value.name ?? 'Пространство'),
        actions: [
          IconButton(
            tooltip: 'Участники',
            icon: const Icon(Icons.group_outlined),
            onPressed: () => context.go('/spaces/$spaceId/members'),
          ),
          if (isFull)
            IconButton(
              tooltip: 'Токены',
              icon: const Icon(Icons.key_outlined),
              onPressed: () => context.go('/spaces/$spaceId/tokens'),
            ),
          if (isFull)
            IconButton(
              tooltip: 'Добавить источник',
              icon: const Icon(Icons.create_new_folder_outlined),
              onPressed: () => _addSource(context, ref),
            ),
          if (isOwner)
            PopupMenuButton<String>(
              tooltip: 'Ещё',
              onSelected: (value) {
                if (value == 'delete') {
                  _deleteSpace(context, ref, space);
                }
              },
              itemBuilder: (context) => const [
                PopupMenuItem(
                  value: 'delete',
                  child: Text('Удалить пространство'),
                ),
              ],
            ),
        ],
      ),
      floatingActionButton: sources.isNotEmpty && canCreateEvents
          ? FloatingActionButton.extended(
              onPressed: () => _addEvent(context, ref, sources),
              icon: const Icon(Icons.add),
              label: const Text('Событие'),
            )
          : null,
      body: spaceAsync.when(
        loading: () => const AppLoadingState(),
        error: (error, _) => AppErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(spaceProvider(spaceId)),
        ),
        data: (space) {
          if (space.sources.isEmpty) {
            return AppEmptyState(
              icon: const Icon(Icons.create_new_folder_outlined),
              title: 'В пространстве нет источников',
              description: isFull
                  ? 'Добавьте источник кнопкой в верхней панели.'
                  : 'Источники появятся, когда владелец их добавит.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(spaceProvider(spaceId)),
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.x4),
              children: [
                if (preset != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.x3),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: AppBadge(
                        label: Preset.label(preset),
                        tone: AppBadgeTone.accent,
                      ),
                    ),
                  ),
                for (final source in space.sources)
                  _SourceSection(source: source, preset: preset),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _addEvent(
    BuildContext context,
    WidgetRef ref,
    List<Source> sources,
  ) async {
    final saved = await showEventForm(context, sources: sources);
    if (saved == true) {
      ref.invalidate(spaceProvider(spaceId));
      ref.invalidate(allEventsProvider);
    }
  }

  Future<void> _addSource(BuildContext context, WidgetRef ref) async {
    final name = await showAppPrompt(
      context,
      title: 'Новый источник',
      label: 'Название',
      confirmLabel: 'Создать',
      validator: (value) => value.isEmpty ? 'Введите название' : null,
    );
    if (name == null || name.isEmpty) {
      return;
    }
    try {
      await ref.read(apiClientProvider).createSource(spaceId, name: name);
      ref.invalidate(spaceProvider(spaceId));
      ref.invalidate(allEventsProvider);
    } catch (error) {
      ref.read(toastProvider.notifier).push(
            title: 'Не удалось создать источник',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    }
  }

  Future<void> _deleteSpace(
    BuildContext context,
    WidgetRef ref,
    Space space,
  ) async {
    final confirmed = await showAppConfirm(
      context,
      title: 'Удалить пространство?',
      message:
          '«${space.name}» и его источники перестанут быть доступны.',
      confirmLabel: 'Удалить',
      danger: true,
    );
    if (!confirmed) {
      return;
    }
    try {
      await ref.read(apiClientProvider).deleteSpace(space.id);
      ref.invalidate(spacesProvider);
      ref.invalidate(allEventsProvider);
      if (context.mounted) {
        context.go('/spaces');
      }
    } catch (error) {
      ref.read(toastProvider.notifier).push(
            title: 'Не удалось удалить пространство',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    }
  }
}

class _SourceSection extends ConsumerWidget {
  const _SourceSection({
    required this.source,
    required this.preset,
  });

  final Source source;
  final String? preset;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
    final color = hexColor(source.color);
    final eventsAsync = ref.watch(eventsProvider(source.id));
    final userId = ref.watch(authControllerProvider).asData?.value?.id;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.x3),
      child: AppCard(
        padding: EdgeInsets.zero,
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: c.borderSubtle),
          child: ExpansionTile(
            leading: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            title: Text(source.name),
            subtitle: Text(
              source.visibility == 'PRIVATE' ? 'Приватный' : 'Общий',
              style: AppTypography.bodySmall.copyWith(color: c.textSecondary),
            ),
            children: [
              eventsAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.all(AppSpacing.x4),
                  child: AppLoadingState(padding: EdgeInsets.zero),
                ),
                error: (error, _) => Padding(
                  padding: const EdgeInsets.all(AppSpacing.x4),
                  child: Text(
                    'Ошибка: $error',
                    style: AppTypography.bodySmall.copyWith(color: c.danger),
                  ),
                ),
                data: (events) {
                  if (events.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.all(AppSpacing.x4),
                      child: Text(
                        'Нет событий',
                        style: AppTypography.bodySmall
                            .copyWith(color: c.textMuted),
                      ),
                    );
                  }
                  return Column(
                    children: [
                      for (final event in events)
                        AppEventTile(
                          event: event,
                          color: color,
                          onTap: () => _openEvent(
                            context,
                            ref,
                            event,
                            userId,
                          ),
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openEvent(
    BuildContext context,
    WidgetRef ref,
    CalendarEvent event,
    String? userId,
  ) async {
    if (event.busy) {
      return;
    }
    if (!Access.canEditEvent(event, preset, userId)) {
      ref.read(toastProvider.notifier).push(
            title: 'Нет прав на изменение события',
            tone: ToastTone.warning,
          );
      return;
    }
    final saved = await showEventForm(
      context,
      sources: [source],
      event: event,
      canDelete: true,
    );
    if (saved == true) {
      ref.invalidate(eventsProvider(source.id));
      ref.invalidate(allEventsProvider);
      ref.invalidate(spaceProvider(source.spaceId));
    }
  }
}
