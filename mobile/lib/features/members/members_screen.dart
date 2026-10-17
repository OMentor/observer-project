import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../shared/widgets/app_progress_indicator.dart';

class MembersScreen extends ConsumerWidget {
  const MembersScreen({super.key, required this.spaceId});

  final String spaceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final presetAsync = ref.watch(spacePresetProvider(spaceId));
    final isFull = presetAsync.asData?.value == Preset.full;
    final membersAsync = ref.watch(membersProvider(spaceId));
    final spaceAsync = ref.watch(spaceProvider(spaceId));
    final ownerId = spaceAsync.asData?.value.ownerId;
    final myId = ref.watch(authControllerProvider).asData?.value?.id;

    return Scaffold(
      appBar: AppBar(title: const Text('Участники')),
      body: membersAsync.when(
        loading: () => const Center(child: AppProgressIndicator()),
        error: (error, _) => Center(child: Text('Ошибка: $error')),
        data: (members) {
          if (members.isEmpty) {
            return const Center(child: Text('Участников нет'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(membersProvider(spaceId)),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: members.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final member = members[index];
                final isOwner = member.userId == ownerId;
                final canManage = isFull && !isOwner;
                return Card(
                  child: ListTile(
                    title: Text(
                      member.userId == myId
                          ? '${member.userName} (вы)'
                          : member.userName,
                    ),
                    subtitle: Text(member.userEmail),
                    trailing: canManage
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              DropdownButton<String>(
                                value: member.preset,
                                underline: const SizedBox.shrink(),
                                items: Preset.all
                                    .map(
                                      (p) => DropdownMenuItem(
                                        value: p,
                                        child: Text(Preset.label(p)),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) async {
                                  if (value == null) {
                                    return;
                                  }
                                  try {
                                    await ref
                                        .read(apiClientProvider)
                                        .updateMember(member.id, value);
                                    ref.invalidate(membersProvider(spaceId));
                                  } catch (error) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                          content: Text(error.toString()),
                                        ),
                                      );
                                    }
                                  }
                                },
                              ),
                              IconButton(
                                tooltip: 'Исключить',
                                icon: const Icon(Icons.person_remove_outlined),
                                onPressed: () => _kick(context, ref, member),
                              ),
                            ],
                          )
                        : Chip(
                            label: Text(
                              isOwner
                                  ? 'Владелец'
                                  : Preset.label(member.preset),
                            ),
                          ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _kick(
    BuildContext context,
    WidgetRef ref,
    Member member,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Исключить участника?'),
        content: Text('${member.userName} потеряет доступ к пространству.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Исключить'),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }
    try {
      await ref.read(apiClientProvider).removeMember(member.id);
      ref.invalidate(membersProvider(spaceId));
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}
