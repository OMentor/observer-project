import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/core/models.dart';
import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/core/theme/app_tokens.dart';
import 'package:pletenie_mobile/features/sync/conflict_card.dart';

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

EventSnapshot _snapshot({
  String title = 'Встреча с клиентом',
  String? description,
  String? location = 'Офис',
  DateTime? start,
  DateTime? end,
}) {
  final startAt = start ?? DateTime(2026, 12, 5, 10);
  return EventSnapshot(
    title: title,
    description: description,
    startAt: startAt,
    endAt: end ?? startAt.add(const Duration(hours: 1)),
    allDay: false,
    timezone: 'UTC',
    location: location,
  );
}

ConflictItem _conflict() {
  return ConflictItem(
    id: 'c1',
    eventId: 'e1',
    connectionId: 'conn1',
    localData: _snapshot(),
    externalData: _snapshot(
      title: 'Встреча с Аней',
      description: 'Новое описание',
      location: null,
      start: DateTime(2026, 12, 5, 10, 30),
      end: DateTime(2026, 12, 5, 11, 30),
    ),
    createdAt: DateTime(2026, 12, 5, 9),
    event: const ConflictEventRef(
      id: 'e1',
      title: 'Встреча с клиентом',
      sourceId: 's1',
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
            key: const Key('conflict-card'),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.x4),
              child: ConflictCard(
                conflict: _conflict(),
                sourceLabel: 'Работа / Команда',
                onResolve: () {},
              ),
            ),
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

  testWidgets('golden: карточка конфликта (тёмная тема)', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(360, 320);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_host(AppTheme.dark()));
    await tester.pumpAndSettle();

    await expectLater(
      find.byKey(const Key('conflict-card')),
      matchesGoldenFile('goldens/conflict_card_dark.png'),
    );
  });

  testWidgets('golden: карточка конфликта (светлая тема)', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(360, 320);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_host(AppTheme.light()));
    await tester.pumpAndSettle();

    await expectLater(
      find.byKey(const Key('conflict-card')),
      matchesGoldenFile('goldens/conflict_card_light.png'),
    );
  });
}
