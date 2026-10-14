import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/main.dart';

void main() {
  testWidgets('renders calendar shell', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: PletenieApp()));
    await tester.pumpAndSettle();

    expect(find.text('Календарь'), findsWidgets);
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
