import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/shared/widgets/app_logo.dart';

Widget host(Widget child) {
  return MaterialApp(
    theme: AppTheme.dark(),
    home: Scaffold(body: Center(child: child)),
  );
}

void main() {
  group('AppLogo', () {
    testWidgets('рисует знак с семантической подписью', (tester) async {
      await tester.pumpWidget(host(const AppLogo()));
      expect(find.byType(AppLogo), findsOneWidget);
      expect(find.byType(CustomPaint), findsWidgets);
      expect(
        tester.getSemantics(find.byType(AppLogo)),
        matchesSemantics(label: 'Плетение', isImage: true),
      );
    });

    testWidgets('без анимации сразу показан целиком', (tester) async {
      await tester.pumpWidget(host(const AppLogo(animated: false)));
      expect(tester.hasRunningAnimations, isFalse);
    });

    testWidgets('с анимацией нити вплетаются и завершаются', (tester) async {
      await tester.pumpWidget(host(const AppLogo(animated: true)));
      expect(tester.hasRunningAnimations, isTrue);

      await tester.pump(const Duration(milliseconds: 200));
      expect(tester.hasRunningAnimations, isTrue);

      await tester.pumpAndSettle();
      expect(tester.hasRunningAnimations, isFalse);
    });

    testWidgets('при уменьшенном движении не анимируется', (tester) async {
      await tester.pumpWidget(
        host(
          const MediaQuery(
            data: MediaQueryData(disableAnimations: true),
            child: AppLogo(animated: true),
          ),
        ),
      );
      expect(tester.hasRunningAnimations, isFalse);
    });
  });
}
