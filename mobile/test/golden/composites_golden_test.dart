import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/core/models.dart';
import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/core/theme/app_tokens.dart';
import 'package:pletenie_mobile/shared/widgets/app_button.dart';
import 'package:pletenie_mobile/shared/widgets/app_empty_state.dart';
import 'package:pletenie_mobile/shared/widgets/app_error_state.dart';
import 'package:pletenie_mobile/shared/widgets/app_event_tile.dart';
import 'package:pletenie_mobile/shared/widgets/app_list_card.dart';
import 'package:pletenie_mobile/shared/widgets/app_loading_state.dart';
import 'package:pletenie_mobile/shared/widgets/app_logo.dart';
import 'package:pletenie_mobile/shared/widgets/app_search_input.dart';
import 'package:pletenie_mobile/shared/widgets/app_section_header.dart';

/// Загружает забандленные шрифты (см. `primitives_golden_test.dart`).
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

CalendarEvent _event({
  String title = 'Встреча команды',
  bool busy = false,
  bool location = false,
}) {
  final start = DateTime(2026, 10, 18, 9);
  return CalendarEvent(
    id: 'e1',
    sourceId: 's1',
    creatorId: 'u1',
    title: title,
    startAt: start,
    endAt: start.add(const Duration(hours: 1)),
    allDay: false,
    timezone: 'UTC',
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    location: location ? 'Переговорная 2' : null,
    busy: busy,
  );
}

Widget _gallery() {
  return Padding(
    padding: const EdgeInsets.all(AppSpacing.x4),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            AppLogo(size: 48),
            SizedBox(width: AppSpacing.x4),
            AppLogo(size: 32, animated: true),
            SizedBox(width: AppSpacing.x4),
            AppLogo(size: 24),
          ],
        ),
        const SizedBox(height: AppSpacing.x4),
        AppSectionHeader(
          title: 'Сегодня',
          description: '3 события',
          action: AppButton(label: 'Добавить', size: AppButtonSize.sm),
        ),
        const SizedBox(height: AppSpacing.x2),
        AppSearchInput(
          controller: TextEditingController(text: 'встреча'),
          placeholder: 'Поиск по названию',
          onChanged: (_) {},
        ),
        const SizedBox(height: AppSpacing.x3),
        AppListCard(
          children: [
            AppListRow(
              leading: Container(
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                  color: Color(0xFF5B5FEF),
                  shape: BoxShape.circle,
                ),
              ),
              title: 'Работа',
              subtitle: '2 источника',
              trailing: Icon(
                Icons.chevron_right,
                color: AppColors.dark.textMuted,
              ),
            ),
            const AppListRow(
              title: 'Дом',
              subtitle: 'Приватный',
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.x3),
        AppEventTile(event: _event(location: true)),
        AppEventTile(event: _event(title: 'Квартальный план', busy: true)),
        const SizedBox(height: AppSpacing.x3),
        AppEmptyState(
          icon: const Icon(Icons.event_busy_outlined),
          title: 'В этом периоде нет событий',
          description: 'Измените период или создайте новое событие.',
          padding: const EdgeInsets.all(AppSpacing.x4),
          action: AppButton(
            label: 'Создать событие',
            variant: AppButtonVariant.secondary,
            size: AppButtonSize.sm,
          ),
        ),
        const SizedBox(height: AppSpacing.x3),
        AppErrorState(
          message: 'Не удалось загрузить события.',
          onRetry: () {},
        ),
        const SizedBox(height: AppSpacing.x3),
        const AppLoadingState(label: 'Загрузка…'),
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

  testWidgets('golden: композиты (тёмная тема)', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(360, 1040);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_host(AppTheme.dark()));
    await tester.pumpAndSettle();

    await expectLater(
      find.byKey(const Key('gallery')),
      matchesGoldenFile('goldens/composites_dark.png'),
    );
  });

  testWidgets('golden: композиты (светлая тема)', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(360, 1040);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_host(AppTheme.light()));
    await tester.pumpAndSettle();

    await expectLater(
      find.byKey(const Key('gallery')),
      matchesGoldenFile('goldens/composites_light.png'),
    );
  });
}
