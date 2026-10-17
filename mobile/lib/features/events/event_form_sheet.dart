import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../shared/widgets/app_progress_indicator.dart';

Future<bool?> showEventForm(
  BuildContext context, {
  required List<Source> sources,
  CalendarEvent? event,
  String? initialSourceId,
  DateTime? initialDate,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: EventFormSheet(
        sources: sources,
        event: event,
        initialSourceId: initialSourceId,
        initialDate: initialDate,
      ),
    ),
  );
}

class EventFormSheet extends ConsumerStatefulWidget {
  const EventFormSheet({
    super.key,
    required this.sources,
    this.event,
    this.initialSourceId,
    this.initialDate,
  });

  final List<Source> sources;
  final CalendarEvent? event;
  final String? initialSourceId;
  final DateTime? initialDate;

  @override
  ConsumerState<EventFormSheet> createState() => _EventFormSheetState();
}

class _EventFormSheetState extends ConsumerState<EventFormSheet> {
  late String _sourceId;
  late TextEditingController _title;
  late TextEditingController _location;
  late TextEditingController _description;
  late bool _allDay;
  late DateTime _date;
  late TimeOfDay _start;
  late TimeOfDay _end;
  bool _saving = false;
  String? _error;

  bool get _isEditing => widget.event != null;

  @override
  void initState() {
    super.initState();
    final event = widget.event;
    _title = TextEditingController(text: event?.title ?? '');
    _location = TextEditingController(text: event?.location ?? '');
    _description = TextEditingController(text: event?.description ?? '');
    _allDay = event?.allDay ?? false;
    _sourceId = event?.sourceId ??
        widget.initialSourceId ??
        (widget.sources.isEmpty ? '' : widget.sources.first.id);
    final start = event?.startAt ?? widget.initialDate ?? DateTime.now();
    final end = event?.endAt ?? start.add(const Duration(hours: 1));
    _date = DateTime(start.year, start.month, start.day);
    _start = TimeOfDay(hour: start.hour, minute: start.minute);
    _end = TimeOfDay(hour: end.hour, minute: end.minute);
  }

  @override
  void dispose() {
    _title.dispose();
    _location.dispose();
    _description.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _isEditing ? 'Событие' : 'Новое событие',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Название'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _sourceId.isEmpty ? null : _sourceId,
              decoration: const InputDecoration(labelText: 'Источник'),
              items: widget.sources
                  .map(
                    (s) => DropdownMenuItem(value: s.id, child: Text(s.name)),
                  )
                  .toList(),
              onChanged: _isEditing
                  ? null
                  : (value) => setState(() => _sourceId = value ?? ''),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickDate,
                    icon: const Icon(Icons.event),
                    label: Text(_formatDate(_date)),
                  ),
                ),
                const SizedBox(width: 12),
                Switch(
                  value: _allDay,
                  onChanged: (value) => setState(() => _allDay = value),
                ),
                const Text('Весь день'),
              ],
            ),
            if (!_allDay) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickTime(true),
                      icon: const Icon(Icons.schedule),
                      label: Text(_formatTime(_start)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickTime(false),
                      icon: const Icon(Icons.schedule),
                      label: Text(_formatTime(_end)),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            TextField(
              controller: _location,
              decoration: const InputDecoration(labelText: 'Место'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _description,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Описание'),
            ),
            if (_isEditing) ...[
              const SizedBox(height: 16),
              _HistorySection(eventId: widget.event!.id),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: AppProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_isEditing ? 'Сохранить' : 'Создать'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() => _date = picked);
    }
  }

  Future<void> _pickTime(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _start : _end,
    );
    if (picked != null) {
      setState(() => isStart ? _start = picked : _end = picked);
    }
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty) {
      setState(() => _error = 'Введите название');
      return;
    }
    if (_sourceId.isEmpty) {
      setState(() => _error = 'Выберите источник');
      return;
    }
    final startAt = _allDay
        ? DateTime(_date.year, _date.month, _date.day)
        : DateTime(
            _date.year,
            _date.month,
            _date.day,
            _start.hour,
            _start.minute,
          );
    final endAt = _allDay
        ? DateTime(_date.year, _date.month, _date.day, 23, 59)
        : DateTime(_date.year, _date.month, _date.day, _end.hour, _end.minute);
    if (!_allDay && !endAt.isAfter(startAt)) {
      setState(() => _error = 'Время окончания раньше начала');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    final payload = EventPayload(
      title: _title.text.trim(),
      startAt: startAt,
      endAt: endAt,
      allDay: _allDay,
      location: _location.text.trim().isEmpty ? null : _location.text.trim(),
      description:
          _description.text.trim().isEmpty ? null : _description.text.trim(),
    );

    try {
      final api = ref.read(apiClientProvider);
      if (_isEditing) {
        await api.updateEvent(widget.event!.id, payload);
      } else {
        await api.createEvent(_sourceId, payload);
      }
      ref.invalidate(eventsProvider);
      ref.invalidate(allEventsProvider);
      ref.invalidate(spaceProvider);
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = error.toString();
        });
      }
    }
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
}

class _HistorySection extends ConsumerWidget {
  const _HistorySection({required this.eventId});

  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(eventHistoryProvider(eventId));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('История', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        historyAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: AppLinearProgressIndicator(),
          ),
          error: (error, _) => Text('История недоступна: $error'),
          data: (entries) {
            if (entries.isEmpty) {
              return const Text('История пуста');
            }
            return Column(
              children: [
                for (final entry in entries)
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      '${entry.actionLabel} · ${entry.userName}',
                    ),
                    subtitle: Text(
                      '${entry.createdAt}'
                      '${entry.oldTitle != null && entry.newTitle != null && entry.oldTitle != entry.newTitle ? ' · ${entry.oldTitle} → ${entry.newTitle}' : ''}',
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}
