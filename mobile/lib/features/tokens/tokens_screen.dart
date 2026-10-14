import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';

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
            IconButton(
              tooltip: 'Новый токен',
              icon: const Icon(Icons.add),
              onPressed: _busy ? null : _create,
            ),
        ],
      ),
      body: !isFull
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Управление токенами доступно владельцу '
                  'и участникам с полным доступом.',
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : _buildList(),
    );
  }

  Widget _buildList() {
    final tokensAsync = ref.watch(tokensProvider(widget.spaceId));
    return tokensAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Ошибка: $error')),
      data: (tokens) {
        final active = tokens.where((t) => !t.revoked).toList();
        if (active.isEmpty) {
          return const Center(child: Text('Активных токенов нет'));
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(tokensProvider(widget.spaceId)),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: active.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final token = active[index];
              return Card(
                child: ListTile(
                  title: Text(Preset.label(token.preset)),
                  subtitle: Text(
                    '${token.statusLabel} · создан '
                    '${_shortDate(token.createdAt)}',
                  ),
                  trailing: IconButton(
                    tooltip: 'Отозвать',
                    icon: const Icon(Icons.delete_outline),
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
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
              const SizedBox(height: 12),
              for (final token in tokens)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: SelectableText(
                    token.token ?? '',
                    style: const TextStyle(fontSize: 12),
                  ),
                  subtitle: Text(Preset.label(token.preset)),
                  trailing: IconButton(
                    icon: const Icon(Icons.copy),
                    onPressed: () {
                      Clipboard.setData(
                        ClipboardData(text: token.token ?? ''),
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Скопировано')),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Готово'),
          ),
        ],
      ),
    );
  }

  Future<void> _revoke(Token token) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Отозвать токен?'),
        content: const Text('Токен перестанет действовать.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Отозвать'),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }
    try {
      await ref.read(apiClientProvider).revokeToken(token.id);
      ref.invalidate(tokensProvider(widget.spaceId));
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}

String _shortDate(String iso) {
  final date = DateTime.parse(iso).toLocal();
  return '${date.day.toString().padLeft(2, '0')}.'
      '${date.month.toString().padLeft(2, '0')}.${date.year}';
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

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Новый токен'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<String>(
            initialValue: _preset,
            decoration: const InputDecoration(labelText: 'Пресет'),
            items: Preset.all
                .map(
                  (p) => DropdownMenuItem(
                    value: p,
                    child: Text(Preset.label(p)),
                  ),
                )
                .toList(),
            onChanged: (value) => setState(() => _preset = value ?? _preset),
          ),
          const SizedBox(height: 8),
          Text(
            Preset.hints[_preset] ?? '',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          TextFormField(
            initialValue: _count.toString(),
            decoration: const InputDecoration(labelText: 'Количество'),
            keyboardType: TextInputType.number,
            onChanged: (value) {
              final parsed = int.tryParse(value) ?? 1;
              _count = parsed.clamp(1, 100);
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(
                  _expiresAt == null
                      ? 'Без срока'
                      : 'До ${_shortDate(_expiresAt!.toIso8601String())}',
                ),
              ),
              TextButton(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 7)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime(2100),
                  );
                  if (picked != null) {
                    setState(() => _expiresAt = picked);
                  }
                },
                child: const Text('Срок'),
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Отмена'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(
            context,
            _TokenDraft(
              preset: _preset,
              count: _count,
              expiresAt: _expiresAt,
            ),
          ),
          child: const Text('Создать'),
        ),
      ],
    );
  }
}
