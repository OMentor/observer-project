import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/toast.dart';
import '../../shared/widgets/app_badge.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_dialogs.dart';
import '../../shared/widgets/app_empty_state.dart';
import '../../shared/widgets/app_error_state.dart';
import '../../shared/widgets/app_loading_state.dart';
import '../../shared/widgets/app_select.dart';

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
        loading: () => const AppLoadingState(),
        error: (error, _) => AppErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(membersProvider(spaceId)),
        ),
        data: (members) {
          if (members.isEmpty) {
            return const AppEmptyState(
              icon: Icon(Icons.group_outlined),
              title: 'Участников нет',
              description: 'Пригласите участников по токену доступа.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(membersProvider(spaceId)),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.x4),
              itemCount: members.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(height: AppSpacing.x2),
              itemBuilder: (context, index) {
                final member = members[index];
                final isOwner = member.userId == ownerId;
                final canManage = isFull && !isOwner;
                return AppCard(
                  padding: EdgeInsets.zero,
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
                              SizedBox(
                                width: 132,
                                child: AppSelect<String>(
                                  value: member.preset,
                                  items: [
                                    for (final p in Preset.all)
                                      AppSelectItem(
                                        value: p,
                                        label: Preset.label(p),
                                      ),
                                  ],
                                  onChanged: (value) =>
                                      _setPreset(ref, member, value),
                                ),
                              ),
                              IconButton(
                                tooltip: 'Исключить',
                                icon: Icon(
                                  Icons.person_remove_outlined,
                                  color: AppColors.of(context).danger,
                                ),
                                onPressed: () =>
                                    _kick(context, ref, member),
                              ),
                            ],
                          )
                        : AppBadge(
                            label:
                                isOwner ? 'Владелец' : Preset.label(member.preset),
                            tone: isOwner
                                ? AppBadgeTone.success
                                : AppBadgeTone.neutral,
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

  Future<void> _setPreset(
    WidgetRef ref,
    Member member,
    String? value,
  ) async {
    if (value == null) {
      return;
    }
    try {
      await ref.read(apiClientProvider).updateMember(member.id, value);
      ref.invalidate(membersProvider(spaceId));
    } catch (error) {
      ref.read(toastProvider.notifier).push(
            title: 'Не удалось изменить пресет',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    }
  }

  Future<void> _kick(
    BuildContext context,
    WidgetRef ref,
    Member member,
  ) async {
    final confirmed = await showAppConfirm(
      context,
      title: 'Исключить участника?',
      message: '${member.userName} потеряет доступ к пространству.',
      confirmLabel: 'Исключить',
      danger: true,
    );
    if (!confirmed) {
      return;
    }
    try {
      await ref.read(apiClientProvider).removeMember(member.id);
      ref.invalidate(membersProvider(spaceId));
    } catch (error) {
      ref.read(toastProvider.notifier).push(
            title: 'Не удалось исключить участника',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    }
  }
}
