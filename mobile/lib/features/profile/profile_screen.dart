import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/toast.dart';
import '../../shared/widgets/app_avatar.dart';
import '../../shared/widgets/app_badge.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_field.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/app_list_card.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _tokenController = TextEditingController();
  bool _activating = false;
  String? _error;

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
      _error = null;
    });
    try {
      final result = await ref.read(apiClientProvider).activateToken(token);
      _tokenController.clear();
      ref.invalidate(spacesProvider);
      ref.read(toastProvider.notifier).push(
            title: 'Пространство присоединено',
            description: 'Пресет: ${Preset.label(result.preset)}',
            tone: ToastTone.success,
          );
    } catch (error) {
      if (mounted) {
        setState(() => _error = 'Не удалось активировать: $error');
      }
      ref.read(toastProvider.notifier).push(
            title: 'Токен не активирован',
            description: error.toString(),
            tone: ToastTone.danger,
          );
    } finally {
      if (mounted) {
        setState(() => _activating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final user = ref.watch(authControllerProvider).asData?.value;
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Профиль')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.x4),
        children: [
          Center(child: AppAvatar(name: user?.name ?? '?', size: 64)),
          const SizedBox(height: AppSpacing.x3),
          if (user != null) ...[
            Center(
              child: Text(
                user.name,
                style: AppTypography.h3.copyWith(color: c.textPrimary),
              ),
            ),
            const SizedBox(height: AppSpacing.x1),
            Center(
              child: Text(
                user.email,
                style: AppTypography.bodySmall.copyWith(
                  color: c.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.x5),
            AppListCard(
              children: [
                AppListRow(
                  leading: Icon(Icons.public, color: c.textSecondary),
                  title: 'Часовой пояс',
                  subtitle: user.timezone,
                ),
                AppListRow(
                  leading: Icon(Icons.badge_outlined, color: c.textSecondary),
                  title: 'Роль',
                  subtitle: user.role,
                ),
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.x5),
          _SectionTitle(title: 'Оформление', color: c.textPrimary),
          const SizedBox(height: AppSpacing.x2),
          SegmentedButton<ThemeMode>(
            showSelectedIcon: false,
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
          const SizedBox(height: AppSpacing.x5),
          _SectionTitle(title: 'Внешние подключения', color: c.textPrimary),
          const SizedBox(height: AppSpacing.x1),
          Text(
            'Синхронизация календарей появится позже.',
            style: AppTypography.bodySmall.copyWith(color: c.textSecondary),
          ),
          const SizedBox(height: AppSpacing.x2),
          AppListCard(
            children: [
              for (final provider in _providers)
                AppListRow(
                  leading: Icon(provider.$2, color: c.textSecondary),
                  title: provider.$1,
                  trailing: const AppBadge(
                    label: 'Скоро',
                    tone: AppBadgeTone.muted,
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.x5),
          _SectionTitle(title: 'Активация токена', color: c.textPrimary),
          const SizedBox(height: AppSpacing.x2),
          AppField(
            label: 'Токен',
            child: AppTextField(
              controller: _tokenController,
              hintText: 'Вставьте токен доступа',
              onSubmitted: (_) => _activating ? null : _activate(),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.x2),
            Text(
              _error!,
              style: AppTypography.bodySmall.copyWith(color: c.danger),
            ),
          ],
          const SizedBox(height: AppSpacing.x3),
          AppButton(
            label: 'Активировать',
            icon: Icons.key,
            expanded: true,
            loading: _activating,
            onPressed: _activating ? null : _activate,
          ),
          const SizedBox(height: AppSpacing.x5),
          AppButton(
            label: 'Выйти',
            icon: Icons.logout,
            variant: AppButtonVariant.secondary,
            expanded: true,
            onPressed: () =>
                ref.read(authControllerProvider.notifier).signOut(),
          ),
          const SizedBox(height: AppSpacing.x4),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.color});

  final String title;
  final Color color;

  @override
  Widget build(BuildContext context) => Text(
        title,
        style: AppTypography.h4.copyWith(color: color),
      );
}
