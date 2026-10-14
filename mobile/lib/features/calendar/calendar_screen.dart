import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../shared/hex_color.dart';
import '../events/event_form_sheet.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(allEventsProvider);
    final spacesAsync = ref.watch(spacesProvider);
    final me = ref.watch(authControllerProvider).asData?.value?.id;

    final spaces = spacesAsync.asData?.value ?? const <Space>[];
    final sources = spaces.expand((s) => s.sources).toList();
    final colorById = {
      for (final source in sources) source.id: hexColor(source.color),
    };
    final spaceBySource = {
      for (final space in spaces)
        for (final source in space.sources) source.id: space.id,
    };
    final presetBySpace = <String, String?>{
      for (final space in spaces)
        space.id: ref.watch(spacePresetProvider(space.id)).asData?.value,
    };
    bool canCreateIn(Source source) {
      final preset = presetBySpace[source.spaceId];
      return preset == Preset.full || preset == Preset.own;
    }

    final canCreate = sources.any(canCreateIn);

    return Scaffold(
      appBar: AppBar(title: const Text('Календарь')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _addEvent(context, ref, sources, canCreate),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(allEventsProvider);
          ref.invalidate(spacesProvider);
        },
        child: eventsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Ошибка: $error')),
          data: (events) {
            if (events.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 160),
                  Center(child: Text('Событий пока нет')),
                ],
              );
            }
            final groups = _groupByDay(events);
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: groups.length,
              itemBuilder: (context, index) {
                final group = groups[index];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        group.label,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    for (final event in group.events)
                      Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Container(
                            width: 4,
                            height: 40,
                            decoration: BoxDecoration(
                              color: event.busy
                                  ? Colors.grey
                                  : colorById[event.sourceId] ??
                                      Theme.of(context).colorScheme.primary,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          title: Text(event.title),
                          subtitle: Text(_timeLabel(event)),
                          trailing: event.location == null
                              ? null
                              : const Icon(Icons.place_outlined, size: 18),
                          onTap: event.busy
                              ? null
                              : () => _openEvent(
                                    context,
                                    ref,
                                    event,
                                    sources,
                                    presetBySpace[
                                        spaceBySource[event.sourceId]],
                                    me,
                                  ),
                        ),
                      ),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }

  Future<void> _addEvent(
    BuildContext context,
    WidgetRef ref,
    List<Source> sources,
    bool canCreate,
  ) async {
    if (sources.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Сначала создайте пространство и источник'),
        ),
      );
      return;
    }
    if (!canCreate) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Нет источников с правом создания событий'),
        ),
      );
      return;
    }
    await showEventForm(context, sources: sources);
  }

  Future<void> _openEvent(
    BuildContext context,
    WidgetRef ref,
    CalendarEvent event,
    List<Source> sources,
    String? preset,
    String? me,
  ) async {
    final canEdit = preset == Preset.full ||
        (preset == Preset.own && event.creatorId == me);
    if (!canEdit) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Нет прав на изменение события')),
      );
      return;
    }
    final source = sources.where((s) => s.id == event.sourceId);
    await showEventForm(
      context,
      sources: source.toList(),
      event: event,
    );
  }
}

class _DayGroup {
  _DayGroup(this.label, this.events);
  final String label;
  final List<CalendarEvent> events;
}

List<_DayGroup> _groupByDay(List<CalendarEvent> events) {
  final map = <String, List<CalendarEvent>>{};
  for (final event in events) {
    final d = event.startAt;
    final key =
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    map.putIfAbsent(key, () => []).add(event);
  }
  final keys = map.keys.toList()..sort();
  return [
    for (final key in keys)
      _DayGroup(_labelFor(map[key]!.first.startAt), map[key]!),
  ];
}

String _labelFor(DateTime date) {
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

String _timeLabel(CalendarEvent event) {
  String two(int v) => v.toString().padLeft(2, '0');
  if (event.allDay) {
    return 'Весь день';
  }
  return '${two(event.startAt.hour)}:${two(event.startAt.minute)} – '
      '${two(event.endAt.hour)}:${two(event.endAt.minute)}';
}
