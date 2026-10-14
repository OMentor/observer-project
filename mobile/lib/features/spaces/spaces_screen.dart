import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';

class SpacesScreen extends ConsumerWidget {
  const SpacesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spaces = ref.watch(spacesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Пространства')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _createSpace(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Пространство'),
      ),
      body: spaces.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Ошибка: $error')),
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('Пока нет пространств'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(spacesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final space = items[index];
                return Card(
                  child: ListTile(
                    title: Text(space.name),
                    subtitle: Text('${space.sources.length} источников'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/spaces/${space.id}'),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _createSpace(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Новое пространство'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Название'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Создать'),
          ),
        ],
      ),
    );
    if (name == null || name.isEmpty) {
      return;
    }
    try {
      await ref.read(apiClientProvider).createSpace(name);
      ref.invalidate(spacesProvider);
      ref.invalidate(allEventsProvider);
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}
