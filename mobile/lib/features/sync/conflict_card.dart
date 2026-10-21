import 'package:flutter/material.dart';

import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/format.dart';
import '../../shared/widgets/app_badge.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import 'conflict_format.dart';

/// Компактная карточка конфликта: заголовок, источник и различающиеся поля.
class ConflictCard extends StatelessWidget {
  const ConflictCard({
    super.key,
    required this.conflict,
    required this.onResolve,
    this.sourceLabel,
  });

  final ConflictItem conflict;
  final VoidCallback onResolve;
  final String? sourceLabel;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final changed = conflictDiff(conflict).where((row) => row.changed).toList();
    final shown = changed.take(2).toList();

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.x4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  formatSnapshotText(conflict.event.title),
                  style: AppTypography.h4.copyWith(color: c.textPrimary),
                ),
              ),
              const SizedBox(width: AppSpacing.x2),
              const AppBadge(
                label: 'Конфликт',
                tone: AppBadgeTone.danger,
                icon: Icon(Icons.warning_amber_rounded, size: 14),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.x2),
          Text(
            [
              ?sourceLabel,
              formatDateTime(conflict.createdAt),
            ].join(' · '),
            style: AppTypography.caption.copyWith(color: c.textSecondary),
          ),
          if (shown.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.x3),
            for (final row in shown) _DiffRow(row: row),
          ],
          const SizedBox(height: AppSpacing.x3),
          Align(
            alignment: Alignment.centerRight,
            child: AppButton(
              label: 'Разрешить',
              size: AppButtonSize.sm,
              onPressed: onResolve,
            ),
          ),
        ],
      ),
    );
  }
}

class _DiffRow extends StatelessWidget {
  const _DiffRow({required this.row});

  final ConflictDiffRow row;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.x2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(
              row.label,
              style: AppTypography.caption.copyWith(color: c.textMuted),
            ),
          ),
          Expanded(child: _ValueColumn(caption: 'Наша', text: row.local)),
          const SizedBox(width: AppSpacing.x2),
          Expanded(child: _ValueColumn(caption: 'Внешняя', text: row.external)),
        ],
      ),
    );
  }
}

class _ValueColumn extends StatelessWidget {
  const _ValueColumn({required this.caption, required this.text});

  final String caption;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          caption,
          style: AppTypography.overline.copyWith(color: c.textMuted),
        ),
        Text(
          text,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: AppTypography.bodySmall.copyWith(color: c.textPrimary),
        ),
      ],
    );
  }
}
