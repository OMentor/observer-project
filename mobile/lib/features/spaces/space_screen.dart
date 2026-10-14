import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../shared/hex_color.dart';
import '../events/event_form_sheet.dart';

class SpaceScreen extends ConsumerWidget {
  const SpaceScreen({super.key, required this.spaceId});

  final String spaceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spaceAsync = ref.watch(spaceProvider(spaceId));
    final sources = spaceAsync.asData?.value.sources ?? const <Source>[];
    final preset = ref.watch(spacePresetProvider(spaceId)).asData?.value;
    final isFull = preset == Preset.full;
    final canCreateEvents = preset == Preset.full || preset == Preset.own;

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
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Ошибка: $error')),
        data: (space) {
          if (space.sources.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  isFull
                      ? 'В пространстве ещё нет источников. '
                          'Добавьте источник кнопкой вверху.'
                      : 'В пространстве ещё нет источников.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (preset != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Chip(label: Text(Preset.label(preset))),
                ),
              for (final source in space.sources)
                _SourceSection(source: source, preset: preset),
            ],
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
    }
  }

  Future<void> _addSource(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Новый источник'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Название'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Создать'),
          ),
        ],
      ),
    );
    if (name == null || name.isEmpty) {
      return;
    }
    try {
      await ref.read(apiClientProvider).createSource(spaceId, name: name);
      ref.invalidate(spaceProvider(spaceId));
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}

class _SourceSection extends ConsumerWidget {
  const _SourceSection({required this.source, required this.preset});

  final Source source;
  final String? preset;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = hexColor(source.color);
    final eventsAsync = ref.watch(eventsProvider(source.id));
    final me = ref.watch(authControllerProvider).asData?.value?.id;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: CircleAvatar(backgroundColor: color, radius: 8),
        title: Text(source.name),
        subtitle: Text(
          source.visibility == 'PRIVATE' ? 'Приватный' : 'Общий',
        ),
        children: [
          eventsAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Ошибка: $error'),
            ),
            data: (events) {
              if (events.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Нет событий'),
                );
              }
              return Column(
                children: [
                  for (final event in events)
                    ListTile(
                      dense: true,
                      enabled: !event.busy,
                      title: Text(event.title),
                      subtitle: Text(_range(event)),
                      onTap: () async {
                        if (event.busy) {
                          return;
                        }
                        final canEdit = preset == Preset.full ||
                            (preset == Preset.own &&
                                event.creatorId == me);
                        if (!canEdit) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Нет прав на изменение события'),
                            ),
                          );
                          return;
                        }
                        final saved = await showEventForm(
                          context,
                          sources: [source],
                          event: event,
                        );
                        if (saved == true) {
                          ref.invalidate(eventsProvider(source.id));
                        }
                      },
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  String _range(CalendarEvent event) {
    final start = event.startAt;
    final end = event.endAt;
    String two(int v) => v.toString().padLeft(2, '0');
    final date =
        '${two(start.day)}.${two(start.month)}.${start.year}';
    if (event.allDay) {
      return '$date · весь день';
    }
    return '$date · ${two(start.hour)}:${two(start.minute)}–'
        '${two(end.hour)}:${two(end.minute)}';
  }
}
