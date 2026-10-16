import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _tokenController = TextEditingController();
  bool _activating = false;
  String? _message;

  static const _providers = [
    ('Яндекс.Календарь', Icons.cloud_outlined),
    ('Mail.ru Календарь', Icons.cloud_outlined),
    ('Apple iCloud', Icons.cloud_outlined),
    ('Google Calendar', Icons.cloud_outlined),
    ('Microsoft Outlook', Icons.cloud_outlined),
  ];

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _activate() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) {
      return;
    }
    setState(() {
      _activating = true;
      _message = null;
    });
    try {
      final result =
          await ref.read(apiClientProvider).activateToken(token);
      setState(() {
        _message = 'Пространство присоединено · ${result.preset}';
      });
    } catch (error) {
      setState(() => _message = 'Не удалось активировать: $error');
    } finally {
      if (mounted) {
        setState(() => _activating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).asData?.value;
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Профиль')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const CircleAvatar(radius: 32, child: Icon(Icons.person, size: 32)),
          const SizedBox(height: 16),
          if (user != null) ...[
            Center(
              child: Text(
                user.name,
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            const SizedBox(height: 4),
            Center(child: Text(user.email)),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.public),
              title: const Text('Часовой пояс'),
              subtitle: Text(user.timezone),
            ),
            ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Роль'),
              subtitle: Text(user.role),
            ),
          ],
          const Divider(height: 32),
          Text('Оформление', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(
                value: ThemeMode.system,
                label: Text('Система'),
                icon: Icon(Icons.brightness_auto),
              ),
              ButtonSegment(
                value: ThemeMode.light,
                label: Text('Светлая'),
                icon: Icon(Icons.light_mode),
              ),
              ButtonSegment(
                value: ThemeMode.dark,
                label: Text('Тёмная'),
                icon: Icon(Icons.dark_mode),
              ),
            ],
            selected: {themeMode},
            onSelectionChanged: (selection) {
              ref.read(themeModeProvider.notifier).set(selection.first);
            },
          ),
          const Divider(height: 32),
          Text(
            'Внешние подключения',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          const Text('Синхронизация календарей появится позже.'),
          const SizedBox(height: 8),
          for (final provider in _providers)
            ListTile(
              leading: Icon(provider.$2),
              title: Text(provider.$1),
              trailing: const Text('Скоро'),
            ),
          const Divider(height: 32),
          Text('Активация токена', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          TextField(
            controller: _tokenController,
            decoration: const InputDecoration(
              labelText: 'Токен',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _activating ? null : _activate,
            icon: const Icon(Icons.key),
            label: const Text('Активировать'),
          ),
          if (_message != null) ...[
            const SizedBox(height: 8),
            Text(_message!),
          ],
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () =>
                ref.read(authControllerProvider.notifier).signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Выйти'),
          ),
        ],
      ),
    );
  }
}
