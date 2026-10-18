import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/format.dart';
import '../../shared/toast.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_dialogs.dart';
import '../../shared/widgets/app_empty_state.dart';
import '../../shared/widgets/app_error_state.dart';
import '../../shared/widgets/app_field.dart';
import '../../shared/widgets/app_icon_button.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/app_loading_state.dart';
import '../../shared/widgets/app_select.dart';

class TokensScreen extends ConsumerStatefulWidget {
  const TokensScreen({super.key, required this.spaceId});

  final String spaceId;

  @override
  ConsumerState<TokensScreen> createState() => _TokensScreenState();
}

class _TokensScreenState extends ConsumerState<TokensScreen> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final presetAsync = ref.watch(spacePresetProvider(widget.spaceId));
    final isFull = presetAsync.asData?.value == Preset.full;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Токены'),
        actions: [
          if (isFull)
            AppIconButton(
              label: 'Новый токен',
              icon: Icons.add,
              onPressed: _busy ? null : _create,
            ),
        ],
      ),
      body: !isFull
          ? const AppEmptyState(
              icon: Icon(Icons.key_outlined),
              title: 'Токены недоступны',
              description:
                  'Управление токенами доступно владельцу '
                  'и участникам с полным доступом.',
            )
          : _buildList(),
    );
  }

  Widget _buildList() {
    final tokensAsync = ref.watch(tokensProvider(widget.spaceId));
    return tokensAsync.when(
      loading: () => const AppLoadingState(),
      error: (error, _) => AppErrorState(
        message: error.toString(),
        onRetry: () => ref.invalidate(tokensProvider(widget.spaceId)),
      ),
      data: (tokens) {
        final active = tokens.where((t) => !t.revoked).toList();
        if (active.isEmpty) {
          return const AppEmptyState(
            icon: Icon(Icons.vpn_key_outlined),
            title: 'Активных токенов нет',
            description:
                'Создайте токен, чтобы пригласить участников в пространство.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(tokensProvider(widget.spaceId)),
          child: ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.x4),
            itemCount: active.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.x2),
            itemBuilder: (context, index) {
              final token = active[index];
              final created = DateTime.parse(token.createdAt).toLocal();
              return AppCard(
                padding: EdgeInsets.zero,
                child: ListTile(
                  title: Text(Preset.label(token.preset)),
                  subtitle: Text(
                    '${token.statusLabel} · создан ${formatDate(created)}',
                  ),
                  trailing: AppIconButton(
                    label: 'Отозвать',
                    icon: Icons.delete_outline,
                    variant: AppIconButtonVariant.danger,
                    onPressed: () => _revoke(token),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _create() async {
    final result = await showDialog<_TokenDraft>(
      context: context,
      builder: (_) => const _TokenDialog(),
    );
    if (result == null) {
      return;
    }
    setState(() => _busy = true);
    try {
      final api = ref.read(apiClientProvider);
      final expires = result.expiresAt?.toUtc().toIso8601String();
      final List<Token> created;
      if (result.count > 1) {
        created = await api.batchTokens(
          spaceId: widget.spaceId,
          preset: result.preset,
          count: result.count,
          expiresAt: expires,
        );
      } else {
        created = [
          await api.createToken(
            widget.spaceId,
            preset: result.preset,
            expiresAt: expires,
          ),
        ];
      }
      ref.invalidate(tokensProvider(widget.spaceId));
      if (mounted) {
        await _showIssued(created);
      }
    } catch (error) {
      ref.read(toastProvider.notifier).push(
            title: 'Не удалось создать токен',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _showIssued(List<Token> tokens) {
    return showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Токены созданы'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView(
            shrinkWrap: true,
            children: [
              const Text(
                'Токен показывается один раз — сохраните его сейчас.',
              ),
              const SizedBox(height: AppSpacing.x3),
              for (final token in tokens)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: SelectableText(
                    token.token ?? '',
                    style: AppTypography.mono.copyWith(fontSize: 12),
                  ),
                  subtitle: Text(Preset.label(token.preset)),
                  trailing: AppIconButton(
                    label: 'Скопировать',
                    icon: Icons.copy,
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: token.token ?? ''));
                      ref.read(toastProvider.notifier).push(
                            title: 'Скопировано',
                            tone: ToastTone.success,
                          );
                    },
                  ),
                ),
            ],
          ),
        ),
        actions: [
          AppButton(
            label: 'Готово',
            size: AppButtonSize.sm,
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Future<void> _revoke(Token token) async {
    final confirmed = await showAppConfirm(
      context,
      title: 'Отозвать токен?',
      message: 'Токен перестанет действовать.',
      confirmLabel: 'Отозвать',
      danger: true,
    );
    if (!confirmed) {
      return;
    }
    try {
      await ref.read(apiClientProvider).revokeToken(token.id);
      ref.invalidate(tokensProvider(widget.spaceId));
    } catch (error) {
      ref.read(toastProvider.notifier).push(
            title: 'Не удалось отозвать токен',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    }
  }
}

class _TokenDraft {
  const _TokenDraft({
    required this.preset,
    required this.count,
    this.expiresAt,
  });

  final String preset;
  final int count;
  final DateTime? expiresAt;
}

class _TokenDialog extends StatefulWidget {
  const _TokenDialog();

  @override
  State<_TokenDialog> createState() => _TokenDialogState();
}

class _TokenDialogState extends State<_TokenDialog> {
  String _preset = Preset.own;
  int _count = 1;
  DateTime? _expiresAt;
  late final TextEditingController _countController =
      TextEditingController(text: '1');

  @override
  void dispose() {
    _countController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return AlertDialog(
      title: const Text('Новый токен'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 320,
            child: AppField(
              label: 'Пресет',
              child: AppSelect<String>(
                value: _preset,
                items: [
                  for (final p in Preset.all)
                    AppSelectItem(value: p, label: Preset.label(p)),
                ],
                onChanged: (value) => setState(() => _preset = value ?? _preset),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.x2),
          Text(
            Preset.hints[_preset] ?? '',
            style: AppTypography.bodySmall.copyWith(color: c.textSecondary),
          ),
          const SizedBox(height: AppSpacing.x3),
          SizedBox(
            width: 320,
            child: AppField(
              label: 'Количество',
              child: AppTextField(
                controller: _countController,
                keyboardType: TextInputType.number,
                onChanged: (value) {
                  final parsed = int.tryParse(value) ?? 1;
                  setState(() => _count = parsed.clamp(1, 100));
                },
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.x3),
          Row(
            children: [
              Expanded(
                child: Text(
                  _expiresAt == null ? 'Без срока' : 'До ${formatDate(_expiresAt!)}',
                  style: AppTypography.body.copyWith(color: c.textPrimary),
                ),
              ),
              AppButton(
                label: 'Срок',
                variant: AppButtonVariant.secondary,
                size: AppButtonSize.sm,
                onPressed: _pickExpires,
              ),
            ],
          ),
        ],
      ),
      actions: [
        AppButton(
          label: 'Отмена',
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          onPressed: () => Navigator.pop(context),
        ),
        AppButton(
          label: 'Создать',
          size: AppButtonSize.sm,
          onPressed: () => Navigator.pop(
            context,
            _TokenDraft(
              preset: _preset,
              count: _count,
              expiresAt: _expiresAt,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickExpires() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() => _expiresAt = picked);
    }
  }
}
