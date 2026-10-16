import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pletenie_mobile/core/network/connectivity_service.dart';
import 'package:pletenie_mobile/shared/widgets/offline_banner.dart';

Widget _wrap({required bool online}) => ProviderScope(
      overrides: [isOnlineProvider.overrideWithValue(online)],
      child: const MaterialApp(
        home: Scaffold(body: OfflineBanner()),
      ),
    );

void main() {
  testWidgets('показывает сообщение об оффлайне, когда сети нет',
      (WidgetTester tester) async {
    await tester.pumpWidget(_wrap(online: false));
    await tester.pumpAndSettle();

    expect(
      find.text('Нет соединения — показаны сохранённые данные'),
      findsOneWidget,
    );
    expect(find.byIcon(Icons.cloud_off), findsOneWidget);
  });

  testWidgets('скрыт, когда устройство онлайн', (WidgetTester tester) async {
    await tester.pumpWidget(_wrap(online: true));
    await tester.pumpAndSettle();

    expect(find.textContaining('Нет соединения'), findsNothing);
  });
}
