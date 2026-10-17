import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/api/api_client.dart';
import '../../core/models.dart';
import '../../shared/widgets/app_progress_indicator.dart';

class ActivateScreen extends ConsumerStatefulWidget {
  const ActivateScreen({super.key, required this.token});

  final String token;

  @override
  ConsumerState<ActivateScreen> createState() => _ActivateScreenState();
}

class _ActivateScreenState extends ConsumerState<ActivateScreen> {
  late final TextEditingController _name;
  bool _busy = false;
  String? _error;
  TokenActivation? _result;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).asData?.value;
    _name = TextEditingController(text: user?.name ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Приглашение')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: _result != null ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  Widget _buildSuccess() {
    final result = _result!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.check_circle, size: 56, color: Colors.green),
        const SizedBox(height: 16),
        const Text(
          'Готово! Вы присоединились к пространству.',
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Ваш пресет: ${Preset.label(result.preset)}.',
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => context.go('/spaces/${result.spaceId}'),
          child: const Text('К пространству'),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: () => context.go('/'),
          child: const Text('В календарь'),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Активация токена доступа к пространству',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _name,
          decoration: const InputDecoration(
            labelText: 'Ваше имя',
            hintText: 'Как вас показывать участникам',
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(
            _error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ],
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _busy ? null : _activate,
          child: _busy
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: AppProgressIndicator(strokeWidth: 2),
                )
              : const Text('Активировать'),
        ),
      ],
    );
  }

  Future<void> _activate() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(apiClientProvider)
          .activateToken(widget.token, name: _name.text.trim());
      ref.invalidate(spacesProvider);
      if (mounted) {
        setState(() => _result = result);
      }
    } on ApiException catch (error) {
      if (mounted) {
        setState(() => _error = error.message);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }
}
