import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/core/models.dart';
import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/shared/access.dart';
import 'package:pletenie_mobile/shared/format.dart';
import 'package:pletenie_mobile/shared/toast.dart';
import 'package:pletenie_mobile/shared/widgets/app_button.dart';
import 'package:pletenie_mobile/shared/widgets/app_dialogs.dart';
import 'package:pletenie_mobile/shared/widgets/app_empty_state.dart';
import 'package:pletenie_mobile/shared/widgets/app_error_state.dart';
import 'package:pletenie_mobile/shared/widgets/app_list_card.dart';
import 'package:pletenie_mobile/shared/widgets/app_loading_state.dart';
import 'package:pletenie_mobile/shared/widgets/app_search_input.dart';
import 'package:pletenie_mobile/shared/widgets/app_section_header.dart';
import 'package:pletenie_mobile/shared/widgets/app_toast_host.dart';

Widget host(Widget child, {Brightness brightness = Brightness.dark}) {
  return MaterialApp(
    theme: brightness == Brightness.dark ? AppTheme.dark() : AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  );
}

CalendarEvent _event({
  String id = 'e1',
  String creatorId = 'u1',
  String title = 'Встреча',
}) {
  final start = DateTime(2026, 10, 18, 9);
  return CalendarEvent(
    id: id,
    sourceId: 's1',
    creatorId: creatorId,
    title: title,
    startAt: start,
    endAt: start.add(const Duration(hours: 1)),
    allDay: false,
    timezone: 'UTC',
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  );
}

void main() {
  group('Access', () {
    test('isFull / canWriteEvents', () {
      expect(Access.isFull(Preset.full), isTrue);
      expect(Access.isFull(Preset.own), isFalse);
      expect(Access.canWriteEvents(Preset.full), isTrue);
      expect(Access.canWriteEvents(Preset.own), isTrue);
      expect(Access.canWriteEvents(Preset.busy), isFalse);
      expect(Access.canWriteEvents(Preset.read), isFalse);
      expect(Access.canWriteEvents(null), isFalse);
    });

    test('canEditEvent', () {
      final own = _event(creatorId: 'me');
      final other = _event(creatorId: 'them');
      expect(Access.canEditEvent(other, Preset.full, 'me'), isTrue);
      expect(Access.canEditEvent(own, Preset.own, 'me'), isTrue);
      expect(Access.canEditEvent(other, Preset.own, 'me'), isFalse);
      expect(Access.canEditEvent(own, Preset.read, 'me'), isFalse);
      expect(Access.canEditEvent(own, null, 'me'), isFalse);
    });
  });

  group('форматирование', () {
    final date = DateTime(2026, 10, 18, 9, 5);

    test('formatTime', () => expect(formatTime(date), '09:05'));

    test('formatDate', () => expect(formatDate(date), '18.10.2026'));

    test('formatDateTime', () =>
        expect(formatDateTime(date), '18.10.2026, 09:05'));

    test('formatTimeRange', () {
      expect(
        formatTimeRange(date, date.add(const Duration(hours: 1, minutes: 25))),
        '09:05 – 10:30',
      );
    });

    test('formatDayTitle', () =>
        expect(formatDayTitle(date), '18 октября, воскресенье'));
  });

  group('AppEmptyState', () {
    testWidgets('показывает заголовок, описание и действие', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        host(
          AppEmptyState(
            icon: const Icon(Icons.inbox),
            title: 'Пока пусто',
            description: 'Добавьте первый источник',
            action: AppButton(
              label: 'Добавить',
              onPressed: () => taps++,
            ),
          ),
        ),
      );
      expect(find.text('Пока пусто'), findsOneWidget);
      expect(find.text('Добавьте первый источник'), findsOneWidget);
      expect(find.byIcon(Icons.inbox), findsOneWidget);
      await tester.tap(find.text('Добавить'));
      expect(taps, 1);
    });
  });

  group('AppErrorState', () {
    testWidgets('показывает сообщение и вызывает повтор', (tester) async {
      var retries = 0;
      await tester.pumpWidget(
        host(
          AppErrorState(
            message: 'Сервер недоступен',
            onRetry: () => retries++,
          ),
        ),
      );
      expect(find.text('Что-то пошло не так'), findsOneWidget);
      expect(find.text('Сервер недоступен'), findsOneWidget);
      await tester.tap(find.text('Повторить'));
      expect(retries, 1);
    });

    testWidgets('без onRetry действия нет', (tester) async {
      await tester.pumpWidget(host(const AppErrorState(message: 'Ошибка')));
      expect(find.text('Повторить'), findsNothing);
    });
  });

  group('AppSectionHeader', () {
    testWidgets('показывает заголовок и действие', (tester) async {
      await tester.pumpWidget(
        host(
          AppSectionHeader(
            title: 'Участники',
            description: '4 человека',
            action: AppButton(label: 'Пригласить', onPressed: () {}),
          ),
        ),
      );
      expect(find.text('Участники'), findsOneWidget);
      expect(find.text('4 человека'), findsOneWidget);
      expect(find.text('Пригласить'), findsOneWidget);
    });
  });

  group('AppListCard', () {
    testWidgets('строки нажимаются', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        host(
          AppListCard(
            children: [
              AppListRow(title: 'Первый', onTap: () => taps++),
              const AppListRow(title: 'Второй', subtitle: 'подпись'),
            ],
          ),
        ),
      );
      expect(find.text('Первый'), findsOneWidget);
      expect(find.text('подпись'), findsOneWidget);
      await tester.tap(find.text('Первый'));
      expect(taps, 1);
    });
  });

  group('AppLoadingState', () {
    testWidgets('показывает подпись', (tester) async {
      await tester.pumpWidget(
        host(const AppLoadingState(label: 'Загрузка…')),
      );
      expect(find.text('Загрузка…'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });

  group('AppSearchInput', () {
    testWidgets('отдаёт введённый текст', (tester) async {
      String? value;
      await tester.pumpWidget(
        host(AppSearchInput(onChanged: (v) => value = v)),
      );
      expect(find.text('Поиск…'), findsOneWidget);
      await tester.enterText(find.byType(TextField), 'событие');
      expect(value, 'событие');
    });
  });

  group('диалоги', () {
    testWidgets('showAppConfirm возвращает true при подтверждении', (
      tester,
    ) async {
      bool? result;
      await tester.pumpWidget(
        host(
          Builder(
            builder: (context) => AppButton(
              label: 'Открыть',
              onPressed: () async {
                result = await showAppConfirm(
                  context,
                  title: 'Удалить?',
                  message: 'Действие необратимо',
                  confirmLabel: 'Удалить',
                  danger: true,
                );
              },
            ),
          ),
        ),
      );
      await tester.tap(find.text('Открыть'));
      await tester.pumpAndSettle();
      expect(find.text('Удалить?'), findsOneWidget);
      await tester.tap(find.text('Удалить'));
      await tester.pumpAndSettle();
      expect(result, isTrue);
    });

    testWidgets('showAppConfirm возвращает false при отмене', (tester) async {
      bool? result;
      await tester.pumpWidget(
        host(
          Builder(
            builder: (context) => AppButton(
              label: 'Открыть',
              onPressed: () async {
                result = await showAppConfirm(context, title: 'Точно?');
              },
            ),
          ),
        ),
      );
      await tester.tap(find.text('Открыть'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Отмена'));
      await tester.pumpAndSettle();
      expect(result, isFalse);
    });

    testWidgets('showAppPrompt возвращает введённый текст', (tester) async {
      String? result;
      await tester.pumpWidget(
        host(
          Builder(
            builder: (context) => AppButton(
              label: 'Имя',
              onPressed: () async {
                result = await showAppPrompt(
                  context,
                  title: 'Новое имя',
                  initialValue: 'Старое',
                  validator: (value) =>
                      value.isEmpty ? 'Введите имя' : null,
                );
              },
            ),
          ),
        ),
      );
      await tester.tap(find.text('Имя'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField).last, 'Работа');
      await tester.tap(find.text('Ок'));
      await tester.pumpAndSettle();
      expect(result, 'Работа');
    });

    testWidgets('showAppPrompt не закрывается при ошибке валидации', (
      tester,
    ) async {
      await tester.pumpWidget(
        host(
          Builder(
            builder: (context) => AppButton(
              label: 'Имя',
              onPressed: () => showAppPrompt(
                context,
                title: 'Новое имя',
                initialValue: '',
                validator: (value) =>
                    value.isEmpty ? 'Введите имя' : null,
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Имя'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ок'));
      await tester.pumpAndSettle();
      expect(find.text('Введите имя'), findsOneWidget);
      expect(find.text('Новое имя'), findsOneWidget);
    });
  });

  group('уведомления', () {
    testWidgets('push/dismiss обновляют состояние и UI', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            theme: AppTheme.dark(),
            home: const AppToastHost(child: Scaffold()),
          ),
        ),
      );

      expect(container.read(toastProvider), isEmpty);
      container
          .read(toastProvider.notifier)
          .push(title: 'Сохранено', tone: ToastTone.success);
      await tester.pump();

      expect(container.read(toastProvider), hasLength(1));
      expect(find.text('Сохранено'), findsOneWidget);

      container.read(toastProvider.notifier).dismiss(1);
      await tester.pumpAndSettle();
      expect(find.text('Сохранено'), findsNothing);
    });

    testWidgets('уведомление само исчезает по TTL', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            theme: AppTheme.dark(),
            home: const AppToastHost(child: Scaffold()),
          ),
        ),
      );

      container.read(toastProvider.notifier).push(title: 'Привет');
      await tester.pump();
      expect(container.read(toastProvider), hasLength(1));

      await tester.pump(const Duration(seconds: 6));
      expect(container.read(toastProvider), isEmpty);
    });
  });
}
