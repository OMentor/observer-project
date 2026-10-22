import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/api/api_client.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/toast.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_error_state.dart';
import '../../shared/widgets/app_loading_state.dart';
import 'conflict_format.dart';
import 'conflict_merge.dart';

/// Разрешение одного конфликта: предпросмотр diff и режим объединения.
class ConflictResolveScreen extends ConsumerStatefulWidget {
  const ConflictResolveScreen({super.key, required this.conflictId});

  final String conflictId;

  @override
  ConsumerState<ConflictResolveScreen> createState() =>
      _ConflictResolveScreenState();
}

class _ConflictResolveScreenState
    extends ConsumerState<ConflictResolveScreen> {
  bool _mergeMode = false;
  MergeSelection? _selection;
  String? _pendingAction;

  Future<void> _resolve(
    ConflictItem conflict,
    Map<String, dynamic> body, {
    required String action,
  }) async {
    setState(() => _pendingAction = action);
    try {
      await ref.read(apiClientProvider).resolveConflict(conflict.id, body);
      ref.invalidate(conflictsProvider);
      ref.invalidate(allEventsProvider);
      ref.invalidate(conflictProvider(conflict.id));
      if (!mounted) {
        return;
      }
      ref.read(toastProvider.notifier).push(
            title: 'Конфликт разрешён',
            tone: ToastTone.success,
          );
      context.pop();
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      final status = error.statusCode;
      final push = ref.read(toastProvider.notifier).push;

      if (status == 409) {
        push(title: 'Конфликт уже разрешён', tone: ToastTone.warning);
        ref.invalidate(conflictsProvider);
        context.pop();
        return;
      }

      final (title, description) = switch (status) {
        403 => ('Нет доступа', error.message),
        503 => (
            'Не удалось записать изменения',
            'Внешний календарь недоступен. Попробуйте ещё раз.',
          ),
        _ when error.isNetwork => ('Нет соединения', error.message),
        _ => ('Не удалось разрешить конфликт', error.message),
      };
      push(title: title, description: description, tone: ToastTone.danger);
    } finally {
      if (mounted) {
        setState(() => _pendingAction = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final conflictAsync = ref.watch(conflictProvider(widget.conflictId));

    return Scaffold(
      appBar: AppBar(title: const Text('Конфликт')),
      body: conflictAsync.when(
        loading: () => const AppLoadingState(label: 'Загружаем конфликт…'),
        error: (error, _) => Padding(
          padding: const EdgeInsets.all(AppSpacing.x4),
          child: AppErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(conflictProvider(widget.conflictId)),
          ),
        ),
        data: (conflict) =>
            _mergeMode ? _buildMerge(conflict) : _buildPreview(conflict),
      ),
    );
  }

  Widget _buildPreview(ConflictItem conflict) {
    final c = AppColors.of(context);
    final rows = conflictDiff(conflict);
    final pending = _pendingAction;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.x4),
      children: [
        Text(
          '«${formatSnapshotText(conflict.event.title)}»',
          style: AppTypography.h3.copyWith(color: c.textPrimary),
        ),
        const SizedBox(height: AppSpacing.x1),
        Text(
          'Встреча изменена у вас и во внешнем календаре. '
          'Выберите, какую версию оставить.',
          style: AppTypography.bodySmall.copyWith(color: c.textSecondary),
        ),
        const SizedBox(height: AppSpacing.x4),
        for (final row in rows) _PreviewRow(row: row),
        if (pending == null) ...[
          const SizedBox(height: AppSpacing.x3),
          AppButton(
            label: 'Наша версия',
            expanded: true,
            onPressed: () => _resolve(
              conflict,
              {'resolution': 'local'},
              action: 'local',
            ),
          ),
          const SizedBox(height: AppSpacing.x2),
          AppButton(
            label: 'Внешняя версия',
            variant: AppButtonVariant.secondary,
            expanded: true,
            onPressed: () => _resolve(
              conflict,
              {'resolution': 'external'},
              action: 'external',
            ),
          ),
          const SizedBox(height: AppSpacing.x2),
          AppButton(
            label: 'Объединить',
            variant: AppButtonVariant.ghost,
            expanded: true,
            onPressed: () => setState(() {
              _selection = MergeSelection(conflict);
              _mergeMode = true;
            }),
          ),
        ] else
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.x4),
            child: AppLoadingState(
              label: pending == 'local'
                  ? 'Оставляем нашу версию…'
                  : 'Применяем внешнюю версию…',
            ),
          ),
      ],
    );
  }

  Widget _buildMerge(ConflictItem conflict) {
    final c = AppColors.of(context);
    final selection = _selection ??= MergeSelection(conflict);

    void update(VoidCallback change) => setState(change);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.x4),
      children: [
        Text(
          'Объединить правки',
          style: AppTypography.h3.copyWith(color: c.textPrimary),
        ),
        const SizedBox(height: AppSpacing.x1),
        Text(
          'Выберите значение для каждого поля. Время берётся целиком '
          'из одной версии.',
          style: AppTypography.bodySmall.copyWith(color: c.textSecondary),
        ),
        const SizedBox(height: AppSpacing.x4),
        _ChoiceField(
          label: 'Название',
          localText: selection.local.title,
          externalText: selection.external.title,
          value: selection.title,
          onChanged: (value) => update(() => selection.title = value),
          own: selection.titleOwn,
          onOwn: (value) => update(() => selection.titleOwn = value),
        ),
        _ChoiceField(
          label: 'Описание',
          localText: formatSnapshotText(selection.local.description),
          externalText: formatSnapshotText(selection.external.description),
          value: selection.description,
          onChanged: (value) => update(() => selection.description = value),
          own: selection.descriptionOwn,
          onOwn: (value) => update(() => selection.descriptionOwn = value),
          multiline: true,
        ),
        _TimeField(
          selection: selection,
          onChanged: (external) =>
              update(() => selection.useExternalTime = external),
        ),
        _ChoiceField(
          label: 'Место',
          localText: formatSnapshotText(selection.local.location),
          externalText: formatSnapshotText(selection.external.location),
          value: selection.location,
          onChanged: (value) => update(() => selection.location = value),
          own: selection.locationOwn,
          onOwn: (value) => update(() => selection.locationOwn = value),
        ),
        if (selection.errorText != null) ...[
          const SizedBox(height: AppSpacing.x2),
          Text(
            selection.errorText!,
            style: AppTypography.bodySmall.copyWith(color: c.danger),
          ),
        ],
        const SizedBox(height: AppSpacing.x4),
        AppButton(
          label: 'Сохранить',
          expanded: true,
          loading: _pendingAction == 'merged',
          onPressed: selection.isValid && _pendingAction == null
              ? () => _resolve(
                    conflict,
                    selection.buildPayload(),
                    action: 'merged',
                  )
              : null,
        ),
        const SizedBox(height: AppSpacing.x2),
        AppButton(
          label: 'Назад',
          variant: AppButtonVariant.ghost,
          expanded: true,
          onPressed: _pendingAction == null
              ? () => setState(() => _mergeMode = false)
              : null,
        ),
      ],
    );
  }
}

class _PreviewRow extends StatelessWidget {
  const _PreviewRow({required this.row});

  final ConflictDiffRow row;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final style = AppTypography.bodySmall.copyWith(
      color: row.changed ? c.textPrimary : c.textMuted,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.x2),
      padding: const EdgeInsets.all(AppSpacing.x3),
      decoration: BoxDecoration(
        color: c.bgElevated,
        borderRadius: AppRadius.allMd,
        border: Border.all(color: c.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            row.label,
            style: AppTypography.overline.copyWith(color: c.textMuted),
          ),
          const SizedBox(height: AppSpacing.x1 + 2),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Наша',
                      style: AppTypography.caption
                          .copyWith(color: c.textMuted),
                    ),
                    Text(row.local, style: style),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.x3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Внешняя',
                      style: AppTypography.caption
                          .copyWith(color: c.textMuted),
                    ),
                    Text(row.external, style: style),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: AppTypography.overline.copyWith(color: AppColors.of(context).textMuted),
    );
  }
}

class _ChoiceField extends StatelessWidget {
  const _ChoiceField({
    required this.label,
    required this.localText,
    required this.externalText,
    required this.value,
    required this.onChanged,
    required this.own,
    required this.onOwn,
    this.multiline = false,
  });

  final String label;
  final String localText;
  final String externalText;
  final FieldChoice value;
  final ValueChanged<FieldChoice> onChanged;
  final String own;
  final ValueChanged<String> onOwn;
  final bool multiline;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.x4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _FieldLabel(text: label),
          const SizedBox(height: AppSpacing.x1 + 2),
          SegmentedButton<FieldChoice>(
            showSelectedIcon: false,
            segments: const [
              ButtonSegment(value: FieldChoice.local, label: Text('Наша')),
              ButtonSegment(value: FieldChoice.external, label: Text('Внешняя')),
              ButtonSegment(value: FieldChoice.own, label: Text('Своё')),
            ],
            selected: {value},
            onSelectionChanged: (selection) => onChanged(selection.first),
          ),
          const SizedBox(height: AppSpacing.x1 + 2),
          Text(
            'Наша: $localText',
            style: AppTypography.caption.copyWith(color: c.textSecondary),
          ),
          Text(
            'Внешняя: $externalText',
            style: AppTypography.caption.copyWith(color: c.textSecondary),
          ),
          if (value == FieldChoice.own) ...[
            const SizedBox(height: AppSpacing.x2),
            _OwnInput(
              key: ValueKey('own-$label'),
              initialValue: own,
              multiline: multiline,
              onChanged: onOwn,
            ),
          ],
        ],
      ),
    );
  }
}

class _TimeField extends StatelessWidget {
  const _TimeField({required this.selection, required this.onChanged});

  final MergeSelection selection;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final external = selection.useExternalTime;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.x4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _FieldLabel(text: 'Время'),
          const SizedBox(height: AppSpacing.x1 + 2),
          SegmentedButton<bool>(
            showSelectedIcon: false,
            segments: const [
              ButtonSegment(value: false, label: Text('Наша')),
              ButtonSegment(value: true, label: Text('Внешняя')),
            ],
            selected: {external},
            onSelectionChanged: (value) => onChanged(value.first),
          ),
          const SizedBox(height: AppSpacing.x1 + 2),
          Text(
            'Наша: ${formatSnapshotWhen(selection.local)}',
            style: AppTypography.caption.copyWith(color: c.textSecondary),
          ),
          Text(
            'Внешняя: ${formatSnapshotWhen(selection.external)}',
            style: AppTypography.caption.copyWith(color: c.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _OwnInput extends StatefulWidget {
  const _OwnInput({
    super.key,
    required this.initialValue,
    required this.onChanged,
    this.multiline = false,
  });

  final String initialValue;
  final ValueChanged<String> onChanged;
  final bool multiline;

  @override
  State<_OwnInput> createState() => _OwnInputState();
}

class _OwnInputState extends State<_OwnInput> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initialValue);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final decoration = InputDecoration(
      hintText: widget.multiline ? 'Своё описание' : 'Своё значение',
    );
    return TextField(
      controller: _controller,
      onChanged: widget.onChanged,
      minLines: widget.multiline ? 2 : 1,
      maxLines: widget.multiline ? 4 : 1,
      keyboardType:
          widget.multiline ? TextInputType.multiline : TextInputType.text,
      decoration: decoration,
    );
  }
}
