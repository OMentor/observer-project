import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/format.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_dialogs.dart';
import '../../shared/widgets/app_field.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/app_progress_indicator.dart';
import '../../shared/widgets/app_select.dart';
import '../../shared/widgets/app_switch.dart';

Future<bool?> showEventForm(
  BuildContext context, {
  required List<Source> sources,
  CalendarEvent? event,
  String? initialSourceId,
  DateTime? initialDate,
  bool canDelete = false,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: EventFormSheet(
        sources: sources,
        event: event,
        initialSourceId: initialSourceId,
        initialDate: initialDate,
        canDelete: canDelete,
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
    this.canDelete = false,
  });

  final List<Source> sources;
  final CalendarEvent? event;
  final String? initialSourceId;
  final DateTime? initialDate;
  final bool canDelete;

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
    final c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.x5,
        0,
        AppSpacing.x5,
        AppSpacing.x6,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _isEditing ? 'Событие' : 'Новое событие',
              style: AppTypography.h3.copyWith(color: c.textPrimary),
            ),
            const SizedBox(height: AppSpacing.x4),
            AppField(
              label: 'Название',
              required: true,
              child: AppTextField(controller: _title),
            ),
            const SizedBox(height: AppSpacing.x3),
            AppField(
              label: 'Источник',
              child: AppSelect<String>(
                value: _sourceId.isEmpty ? null : _sourceId,
                items: [
                  for (final source in widget.sources)
                    AppSelectItem(value: source.id, label: source.name),
                ],
                onChanged: _isEditing
                    ? null
                    : (value) => setState(() => _sourceId = value ?? ''),
              ),
            ),
            const SizedBox(height: AppSpacing.x3),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: formatDate(_date),
                    icon: Icons.event,
                    variant: AppButtonVariant.secondary,
                    expanded: true,
                    onPressed: _pickDate,
                  ),
                ),
                const SizedBox(width: AppSpacing.x3),
                AppSwitch(
                  value: _allDay,
                  label: 'Весь день',
                  onChanged: (value) => setState(() => _allDay = value),
                ),
                const SizedBox(width: AppSpacing.x2),
                Text(
                  'Весь день',
                  style: AppTypography.bodySmall.copyWith(
                    color: c.textSecondary,
                  ),
                ),
              ],
            ),
            if (!_allDay) ...[
              const SizedBox(height: AppSpacing.x3),
              Row(
                children: [
                  Expanded(
                    child: AppButton(
                      label: _formatTime(_start),
                      icon: Icons.schedule,
                      variant: AppButtonVariant.secondary,
                      expanded: true,
                      onPressed: () => _pickTime(true),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.x3),
                  Expanded(
                    child: AppButton(
                      label: _formatTime(_end),
                      icon: Icons.schedule,
                      variant: AppButtonVariant.secondary,
                      expanded: true,
                      onPressed: () => _pickTime(false),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: AppSpacing.x3),
            AppField(
              label: 'Место',
              child: AppTextField(controller: _location),
            ),
            const SizedBox(height: AppSpacing.x3),
            AppField(
              label: 'Описание',
              child: AppTextarea(controller: _description),
            ),
            if (_isEditing) ...[
              const SizedBox(height: AppSpacing.x4),
              _HistorySection(eventId: widget.event!.id),
            ],
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.x3),
              Text(
                _error!,
                style: AppTypography.bodySmall.copyWith(color: c.danger),
              ),
            ],
            const SizedBox(height: AppSpacing.x5),
            AppButton(
              label: _isEditing ? 'Сохранить' : 'Создать',
              expanded: true,
              loading: _saving,
              onPressed: _saving ? null : _save,
            ),
            if (_isEditing && widget.canDelete) ...[
              const SizedBox(height: AppSpacing.x2),
              AppButton(
                label: 'Удалить',
                icon: Icons.delete_outline,
                variant: AppButtonVariant.danger,
                expanded: true,
                onPressed: _saving ? null : _delete,
              ),
            ],
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

  Future<void> _delete() async {
    final confirmed = await showAppConfirm(
      context,
      title: 'Удалить событие?',
      message: 'Действие необратимо.',
      confirmLabel: 'Удалить',
      danger: true,
    );
    if (!confirmed || !mounted) {
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(apiClientProvider).deleteEvent(widget.event!.id);
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

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
}

class _HistorySection extends ConsumerWidget {
  const _HistorySection({required this.eventId});

  final String eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
    final historyAsync = ref.watch(eventHistoryProvider(eventId));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'История',
          style: AppTypography.h4.copyWith(color: c.textPrimary),
        ),
        const SizedBox(height: AppSpacing.x2),
        historyAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.x2),
            child: AppLinearProgressIndicator(),
          ),
          error: (error, _) => Text(
            'История недоступна: $error',
            style: AppTypography.bodySmall.copyWith(color: c.danger),
          ),
          data: (entries) {
            if (entries.isEmpty) {
              return Text(
                'История пуста',
                style: AppTypography.bodySmall.copyWith(color: c.textMuted),
              );
            }
            return Column(
              children: [
                for (final entry in entries)
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text('${entry.actionLabel} · ${entry.userName}'),
                    subtitle: Text(
                      '${formatDateTime(DateTime.parse(entry.createdAt).toLocal())}'
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
