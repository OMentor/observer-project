import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/core/theme/app_tokens.dart';
import 'package:pletenie_mobile/shared/widgets/app_avatar.dart';
import 'package:pletenie_mobile/shared/widgets/app_badge.dart';
import 'package:pletenie_mobile/shared/widgets/app_button.dart';
import 'package:pletenie_mobile/shared/widgets/app_card.dart';
import 'package:pletenie_mobile/shared/widgets/app_chip.dart';
import 'package:pletenie_mobile/shared/widgets/app_field.dart';
import 'package:pletenie_mobile/shared/widgets/app_input.dart';
import 'package:pletenie_mobile/shared/widgets/app_select.dart';
import 'package:pletenie_mobile/shared/widgets/app_skeleton.dart';
import 'package:pletenie_mobile/shared/widgets/app_switch.dart';
import 'package:pletenie_mobile/shared/widgets/preset_badge.dart';

/// Загружает забандленные шрифты, чтобы эталоны содержали реальные глифы,
/// а не «квадратики» тестового шрифта.
Future<void> _loadFonts() async {
  Future<void> load(String family, List<String> weights) async {
    final loader = FontLoader(family);
    for (final weight in weights) {
      loader.addFont(rootBundle.load('assets/fonts/$family-$weight.ttf'));
    }
    await loader.load();
  }

  await load('Onest', const ['400', '500', '600', '700']);
  await load('Lora', const ['400', '600']);
}

Widget _gallery() {
  final c = AppColors.dark;
  return Padding(
    padding: const EdgeInsets.all(AppSpacing.x4),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: AppSpacing.x2,
          runSpacing: AppSpacing.x2,
          children: const [
            AppButton(label: 'Primary'),
            AppButton(label: 'Secondary', variant: AppButtonVariant.secondary),
            AppButton(label: 'Ghost', variant: AppButtonVariant.ghost),
            AppButton(label: 'Danger', variant: AppButtonVariant.danger),
            AppButton(label: 'Token', variant: AppButtonVariant.token),
            AppButton(label: 'Sm', size: AppButtonSize.sm),
            AppButton(label: 'Lg', size: AppButtonSize.lg),
            AppButton(label: 'Икон', icon: Icons.add),
            AppButton(label: 'Загрузка', loading: true),
          ],
        ),
        const SizedBox(height: AppSpacing.x4),
        const Wrap(
          spacing: AppSpacing.x2,
          runSpacing: AppSpacing.x2,
          children: [
            AppBadge(label: 'Success', tone: AppBadgeTone.success),
            AppBadge(label: 'Accent', tone: AppBadgeTone.accent),
            AppBadge(label: 'Amber', tone: AppBadgeTone.amber),
            AppBadge(label: 'Danger', tone: AppBadgeTone.danger),
            AppBadge(label: 'Muted', tone: AppBadgeTone.muted),
            AppBadge(label: 'Neutral', tone: AppBadgeTone.neutral),
          ],
        ),
        const SizedBox(height: AppSpacing.x3),
        const Wrap(
          spacing: AppSpacing.x2,
          runSpacing: AppSpacing.x2,
          children: [
            PresetBadge(preset: 'FULL'),
            PresetBadge(preset: 'OWN'),
            PresetBadge(preset: 'BUSY'),
            PresetBadge(preset: 'READ'),
          ],
        ),
        const SizedBox(height: AppSpacing.x3),
        Wrap(
          spacing: AppSpacing.x2,
          runSpacing: AppSpacing.x2,
          children: [
            AppChip(label: 'Дом', color: c.accent),
            AppChip(label: 'Работа', color: c.amber, onRemove: () {}),
          ],
        ),
        const SizedBox(height: AppSpacing.x4),
        const Row(
          children: [
            AppAvatar(name: 'Иван Петров'),
            SizedBox(width: AppSpacing.x3),
            AppAvatar(name: 'Мария'),
            SizedBox(width: AppSpacing.x3),
            AppAvatar(name: 'Alex Johnson', size: 48),
          ],
        ),
        const SizedBox(height: AppSpacing.x4),
        const AppField(
          label: 'Название',
          helper: 'Видно участникам',
          child: AppTextField(hintText: 'Введите название'),
        ),
        const SizedBox(height: AppSpacing.x3),
        const AppField(
          label: 'E-mail',
          error: 'Некорректный адрес',
          child: AppTextField(hintText: 'name@example.com', error: true),
        ),
        const SizedBox(height: AppSpacing.x3),
        AppSelect<String>(
          value: 'SHARED',
          onChanged: (_) {},
          items: const [
            AppSelectItem(value: 'SHARED', label: 'Общий'),
            AppSelectItem(value: 'PRIVATE', label: 'Личный'),
          ],
        ),
        const SizedBox(height: AppSpacing.x4),
        const Row(
          children: [
            AppSwitch(value: true),
            SizedBox(width: AppSpacing.x4),
            AppSwitch(value: false),
          ],
        ),
        const SizedBox(height: AppSpacing.x4),
        const AppCard(
          child: Text('Карточка с тенью и скруглением 14'),
        ),
        const SizedBox(height: AppSpacing.x3),
        const AppSkeleton(width: 220, height: 20),
      ],
    ),
  );
}

Widget _host(ThemeData theme) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: theme,
    home: Builder(
      builder: (context) => MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: true),
        child: Scaffold(
          backgroundColor: theme.scaffoldBackgroundColor,
          body: RepaintBoundary(
            key: const Key('gallery'),
            child: SingleChildScrollView(child: _gallery()),
          ),
        ),
      ),
    ),
  );
}

void main() {
  setUpAll(() async {
    try {
      await _loadFonts();
    } catch (_) {
      // Шрифты недоступны — эталоны будут с тестовыми глифами.
    }
  });

  testWidgets('golden: примитивы (тёмная тема)', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(360, 760);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_host(AppTheme.dark()));
    await tester.pumpAndSettle();

    await expectLater(
      find.byKey(const Key('gallery')),
      matchesGoldenFile('goldens/primitives_dark.png'),
    );
  });

  testWidgets('golden: примитивы (светлая тема)', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(360, 760);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_host(AppTheme.light()));
    await tester.pumpAndSettle();

    await expectLater(
      find.byKey(const Key('gallery')),
      matchesGoldenFile('goldens/primitives_light.png'),
    );
  });
}
