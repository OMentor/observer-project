import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../shared/hex_color.dart';
import '../../shared/widgets/offline_banner.dart';
import '../../shared/widgets/realtime_indicator.dart';
import '../events/event_form_sheet.dart';
import 'calendar_range.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  String _spaceFilter = '';
  String _sourceFilter = '';
  String _query = '';
  CalendarView _view = CalendarView.month;
  DateTime _anchor = DateTime.now();
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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

    final spaceSources =
        _spaceFilter.isEmpty
            ? sources
            : sources.where((s) => s.spaceId == _spaceFilter).toList();
    final sourceFilterValid =
        _sourceFilter.isEmpty ||
        spaceSources.any((s) => s.id == _sourceFilter);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Календарь'),
        actions: const [RealtimeIndicator()],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _addEvent(context, sources, canCreate),
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
          data: (allEvents) {
            final events = allEvents.where((event) {
              if (!overlapsPeriod(
                _view,
                _anchor,
                event.startAt,
                event.endAt,
              )) {
                return false;
              }
              if (_spaceFilter.isNotEmpty &&
                  spaceBySource[event.sourceId] != _spaceFilter) {
                return false;
              }
              if (sourceFilterValid &&
                  _sourceFilter.isNotEmpty &&
                  event.sourceId != _sourceFilter) {
                return false;
              }
              if (_query.isNotEmpty &&
                  !event.title.toLowerCase().contains(
                        _query.toLowerCase(),
                      )) {
                return false;
              }
              return true;
            }).toList();
            final groups = _groupByDay(events);

            return Column(
              children: [
                _PeriodBar(
                  view: _view,
                  title: periodTitle(_view, _anchor),
                  onView: (value) => setState(() => _view = value),
                  onPrev: () => setState(() {
                    _anchor = shiftPeriod(_view, _anchor, -1);
                  }),
                  onNext: () => setState(() {
                    _anchor = shiftPeriod(_view, _anchor, 1);
                  }),
                  onToday: () => setState(() => _anchor = DateTime.now()),
                ),
                const OfflineBanner(),
                if (sources.isNotEmpty)
                  _Filters(
                    spaces: spaces,
                    sources: spaceSources,
                    spaceFilter: _spaceFilter,
                    sourceFilter: sourceFilterValid ? _sourceFilter : '',
                    controller: _searchController,
                    onSpace: (value) => setState(() {
                      _spaceFilter = value;
                      _sourceFilter = '';
                    }),
                    onSource: (value) => setState(() => _sourceFilter = value),
                    onQuery: (value) => setState(() => _query = value),
                  ),
                Expanded(
                  child: events.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 160),
                            Center(child: Text('В этом периоде нет событий')),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: groups.length,
                          itemBuilder: (context, index) {
                            final group = groups[index];
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 8),
                                  child: Text(
                                    group.label,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium,
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
                                                  Theme.of(context)
                                                      .colorScheme
                                                      .primary,
                                          borderRadius:
                                              BorderRadius.circular(2),
                                        ),
                                      ),
                                      title: Text(event.title),
                                      subtitle: Text(_timeLabel(event)),
                                      trailing: event.location == null
                                          ? null
                                          : const Icon(
                                              Icons.place_outlined,
                                              size: 18,
                                            ),
                                      onTap: event.busy
                                          ? null
                                          : () => _openEvent(
                                                context,
                                                event,
                                                sources,
                                                presetBySpace[spaceBySource[
                                                    event.sourceId]],
                                                me,
                                              ),
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _addEvent(
    BuildContext context,
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
    await showEventForm(
      context,
      sources: sources,
      initialSourceId: _sourceFilter.isEmpty ? null : _sourceFilter,
    );
  }

  Future<void> _openEvent(
    BuildContext context,
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

class _Filters extends StatelessWidget {
  const _Filters({
    required this.spaces,
    required this.sources,
    required this.spaceFilter,
    required this.sourceFilter,
    required this.controller,
    required this.onSpace,
    required this.onSource,
    required this.onQuery,
  });

  final List<Space> spaces;
  final List<Source> sources;
  final String spaceFilter;
  final String sourceFilter;
  final TextEditingController controller;
  final ValueChanged<String> onSpace;
  final ValueChanged<String> onSource;
  final ValueChanged<String> onQuery;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Column(
        children: [
          TextField(
            controller: controller,
            onChanged: onQuery,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Поиск по названию',
              isDense: true,
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: spaceFilter.isEmpty ? null : spaceFilter,
                  decoration: const InputDecoration(
                    labelText: 'Пространство',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  items: [
                    const DropdownMenuItem(value: '', child: Text('Все')),
                    for (final space in spaces)
                      DropdownMenuItem(
                        value: space.id,
                        child: Text(space.name),
                      ),
                  ],
                  onChanged: (value) => onSpace(value ?? ''),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: sourceFilter.isEmpty ? null : sourceFilter,
                  decoration: const InputDecoration(
                    labelText: 'Источник',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  items: [
                    const DropdownMenuItem(value: '', child: Text('Все')),
                    for (final source in sources)
                      DropdownMenuItem(
                        value: source.id,
                        child: Text(source.name),
                      ),
                  ],
                  onChanged: (value) => onSource(value ?? ''),
                ),
              ),
            ],
          ),
        ],
      ),
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
      _DayGroup(dayLabel(map[key]!.first.startAt), map[key]!),
  ];
}

class _PeriodBar extends StatelessWidget {
  const _PeriodBar({
    required this.view,
    required this.title,
    required this.onView,
    required this.onPrev,
    required this.onNext,
    required this.onToday,
  });

  final CalendarView view;
  final String title;
  final ValueChanged<CalendarView> onView;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback onToday;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: onPrev,
                icon: const Icon(Icons.chevron_left),
                tooltip: 'Назад',
              ),
              Expanded(
                child: Center(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              IconButton(
                onPressed: onToday,
                icon: const Icon(Icons.today),
                tooltip: 'Сегодня',
              ),
              IconButton(
                onPressed: onNext,
                icon: const Icon(Icons.chevron_right),
                tooltip: 'Вперёд',
              ),
            ],
          ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<CalendarView>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(
                        value: CalendarView.day,
                        label: Text('День'),
                      ),
                      ButtonSegment(
                        value: CalendarView.week,
                        label: Text('Неделя'),
                      ),
                      ButtonSegment(
                        value: CalendarView.month,
                        label: Text('Месяц'),
                      ),
                    ],
                    selected: {view},
                    onSelectionChanged: (selection) => onView(selection.first),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

String _timeLabel(CalendarEvent event) {
  String two(int v) => v.toString().padLeft(2, '0');
  if (event.allDay) {
    return 'Весь день';
  }
  return '${two(event.startAt.hour)}:${two(event.startAt.minute)} – '
      '${two(event.endAt.hour)}:${two(event.endAt.minute)}';
}
