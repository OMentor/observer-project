import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).asData?.value;

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
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
            icon: const Icon(Icons.logout),
            label: const Text('Выйти'),
          ),
        ],
      ),
    );
  }
}
