import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Профиль')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Профиль пользователя'),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
              child: const Text('Выйти'),
            ),
          ],
        ),
      ),
    );
  }
}
