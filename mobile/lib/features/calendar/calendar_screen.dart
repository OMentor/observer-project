import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/access.dart';
import '../../shared/hex_color.dart';
import '../../shared/toast.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_empty_state.dart';
import '../../shared/widgets/app_error_state.dart';
import '../../shared/widgets/app_event_tile.dart';
import '../../shared/widgets/app_loading_state.dart';
import '../../shared/widgets/app_search_input.dart';
import '../../shared/widgets/app_select.dart';
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
    bool canCreateIn(Source source) =>
        Access.canWriteEvents(presetBySpace[source.spaceId]);

    final canCreate = sources.any(canCreateIn);

    final spaceSources = _spaceFilter.isEmpty
        ? sources
        : sources.where((s) => s.spaceId == _spaceFilter).toList();
    final sourceFilterValid =
        _sourceFilter.isEmpty || spaceSources.any((s) => s.id == _sourceFilter);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Календарь'),
        actions: const [RealtimeIndicator()],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _addEvent(context, sources, canCreate),
        tooltip: 'Создать событие',
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(allEventsProvider);
          ref.invalidate(spacesProvider);
        },
        child: eventsAsync.when(
          loading: () => const AppLoadingState(),
          error: (error, _) => AppErrorState(
            message: error.toString(),
            onRetry: () {
              ref.invalidate(allEventsProvider);
              ref.invalidate(spacesProvider);
            },
          ),
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
                  !event.title.toLowerCase().contains(_query.toLowerCase())) {
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
                          padding: const EdgeInsets.all(AppSpacing.x4),
                          children: const [
                            SizedBox(height: AppSpacing.x8),
                            AppEmptyState(
                              icon: Icon(Icons.event_busy_outlined),
                              title: 'В этом периоде нет событий',
                              description:
                                  'Измените период или создайте новое событие.',
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(AppSpacing.x4),
                          itemCount: groups.length,
                          itemBuilder: (context, index) {
                            final group = groups[index];
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: AppSpacing.x2,
                                  ),
                                  child: Text(
                                    group.label,
                                    style: AppTypography.h4.copyWith(
                                      color: AppColors.of(context).textPrimary,
                                    ),
                                  ),
                                ),
                                for (final event in group.events)
                                  Padding(
                                    padding: const EdgeInsets.only(
                                      bottom: AppSpacing.x2,
                                    ),
                                    child: AppCard(
                                      padding: EdgeInsets.zero,
                                      child: AppEventTile(
                                        event: event,
                                        color: colorById[event.sourceId],
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
      ref.read(toastProvider.notifier).push(
            title: 'Сначала создайте пространство и источник',
            tone: ToastTone.warning,
          );
      return;
    }
    if (!canCreate) {
      ref.read(toastProvider.notifier).push(
            title: 'Нет источников с правом создания событий',
            tone: ToastTone.warning,
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
    if (!Access.canEditEvent(event, preset, me)) {
      ref.read(toastProvider.notifier).push(
            title: 'Нет прав на изменение события',
            tone: ToastTone.warning,
          );
      return;
    }
    final source = sources.where((s) => s.id == event.sourceId);
    await showEventForm(
      context,
      sources: source.toList(),
      event: event,
      canDelete: true,
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
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.x4,
        AppSpacing.x3,
        AppSpacing.x4,
        AppSpacing.x1,
      ),
      child: Column(
        children: [
          AppSearchInput(
            controller: controller,
            placeholder: 'Поиск по названию',
            onChanged: onQuery,
          ),
          const SizedBox(height: AppSpacing.x2),
          Row(
            children: [
              Expanded(
                child: AppSelect<String>(
                  value: spaceFilter.isEmpty ? null : spaceFilter,
                  hintText: 'Все пространства',
                  items: [
                    for (final space in spaces)
                      AppSelectItem(value: space.id, label: space.name),
                  ],
                  onChanged: (value) => onSpace(value ?? ''),
                ),
              ),
              const SizedBox(width: AppSpacing.x2),
              Expanded(
                child: AppSelect<String>(
                  value: sourceFilter.isEmpty ? null : sourceFilter,
                  hintText: 'Все источники',
                  items: [
                    for (final source in sources)
                      AppSelectItem(value: source.id, label: source.name),
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
    final c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.x2,
        AppSpacing.x2,
        AppSpacing.x2,
        0,
      ),
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
                    style: AppTypography.h4.copyWith(color: c.textPrimary),
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
          const SizedBox(height: AppSpacing.x1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.x2),
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
          const SizedBox(height: AppSpacing.x1),
        ],
      ),
    );
  }
}
