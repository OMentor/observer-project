import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:pletenie_mobile/app.dart';
import 'package:pletenie_mobile/main.dart' show PletenieApp;
import 'package:pletenie_mobile/core/auth/session_manager.dart';
import 'package:pletenie_mobile/core/storage/token_storage.dart';

const _email = String.fromEnvironment('E2E_EMAIL');
const _password = String.fromEnvironment(
  'E2E_PASS',
  defaultValue: 'password123',
);

Future<void> _startApp() async {
  final session = SessionManager(TokenStorage());
  await session.load();
  runApp(
    ProviderScope(
      overrides: [sessionManagerProvider.overrideWithValue(session)],
      child: const PletenieApp(),
    ),
  );
}

Future<void> _settle(
  WidgetTester tester, {
  Duration step = const Duration(milliseconds: 300),
  int times = 12,
}) async {
  for (var i = 0; i < times; i++) {
    await tester.pump(step);
  }
}

Future<void> _waitFor(
  WidgetTester tester,
  Finder finder, {
  int attempts = 40,
}) async {
  for (var i = 0; i < attempts; i++) {
    if (finder.evaluate().isNotEmpty) {
      return;
    }
    await tester.pump(const Duration(milliseconds: 250));
  }
  final visible = find
      .byType(Text)
      .evaluate()
      .map((element) => (element.widget as Text).data)
      .whereType<String>()
      .toList();
  fail('Не дождались: $finder\nВидимые тексты: $visible');
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'E2E: вход, список конфликтов и внешняя версия',
    (tester) async {
      expect(_email, isNotEmpty, reason: 'Передайте --dart-define=E2E_EMAIL');

      await _startApp();
      await _settle(tester);

      final fields = find.byType(TextField);
      expect(fields, findsNWidgets(2));
      await tester.enterText(fields.at(0), _email);
      await tester.enterText(fields.at(1), _password);
      await tester.tap(find.text('Войти'));

      await _waitFor(tester, find.text('Профиль'));
      await _waitFor(tester, find.byType(Badge));
      expect(find.byType(Badge), findsOneWidget);

      await tester.tap(find.text('Профиль'));
      await _settle(tester);
      await tester.scrollUntilVisible(
        find.text('Конфликты синхронизации'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Конфликты синхронизации'), findsOneWidget);

      await tester.tap(find.text('Конфликты синхронизации'));
      await _waitFor(tester, find.text('Разрешить'));

      expect(find.text('Конфликты'), findsOneWidget);
      expect(find.text('Local Title'), findsWidgets);
      expect(find.text('External Title'), findsWidgets);

      await tester.tap(find.text('Разрешить'));
      await _waitFor(tester, find.text('Наша версия'));

      await tester.scrollUntilVisible(
        find.text('Внешняя версия'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(find.text('Внешняя версия'));

      await _waitFor(tester, find.text('Нет конфликтов'));
      expect(find.text('Нет конфликтов'), findsOneWidget);
    },
    timeout: const Timeout(Duration(minutes: 3)),
  );
}
