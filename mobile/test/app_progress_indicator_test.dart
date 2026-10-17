import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pletenie_mobile/core/motion/motion.dart';
import 'package:pletenie_mobile/shared/widgets/app_progress_indicator.dart';

/// Оборачивает [child] в дерево с управляемой настройкой уменьшения движения.
Widget _host(Widget child, {required bool reduceMotion}) {
  return MaterialApp(
    home: Builder(
      builder: (context) => MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: reduceMotion),
        child: Scaffold(body: Center(child: child)),
      ),
    ),
  );
}

void main() {
  group('AppProgressIndicator', () {
    testWidgets('вращается (indeterminate) в обычном режиме', (tester) async {
      await tester.pumpWidget(
        _host(const AppProgressIndicator(), reduceMotion: false),
      );
      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.value, isNull);
    });

    testWidgets('статичен (determinate) при уменьшенном движении', (
      tester,
    ) async {
      await tester.pumpWidget(
        _host(const AppProgressIndicator(), reduceMotion: true),
      );
      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.value, isNotNull);
      expect(indicator.value, greaterThan(0));
      // Нет бесконечной анимации — кадры завершаются без таймаута.
      await tester.pumpAndSettle();
    });

    testWidgets('сохраняет явное значение при уменьшенном движении', (
      tester,
    ) async {
      await tester.pumpWidget(
        _host(const AppProgressIndicator(value: 0.3), reduceMotion: true),
      );
      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.value, 0.3);
      await tester.pumpWidget(const SizedBox());
    });
  });

  group('AppLinearProgressIndicator', () {
    testWidgets('статичен (determinate) при уменьшенном движении', (
      tester,
    ) async {
      await tester.pumpWidget(
        _host(const AppLinearProgressIndicator(), reduceMotion: true),
      );
      final indicator = tester.widget<LinearProgressIndicator>(
        find.byType(LinearProgressIndicator),
      );
      expect(indicator.value, isNotNull);
      await tester.pumpAndSettle();
    });

    testWidgets('indeterminate в обычном режиме', (tester) async {
      await tester.pumpWidget(
        _host(const AppLinearProgressIndicator(), reduceMotion: false),
      );
      final indicator = tester.widget<LinearProgressIndicator>(
        find.byType(LinearProgressIndicator),
      );
      expect(indicator.value, isNull);
      await tester.pumpWidget(const SizedBox());
    });
  });

  testWidgets('Motion сворачивает длительность при уменьшенном движении', (
    tester,
  ) async {
    late BuildContext context;
    await tester.pumpWidget(
      _host(
        Builder(
          builder: (value) {
            context = value;
            return const SizedBox();
          },
        ),
        reduceMotion: true,
      ),
    );
    expect(context.reduceMotion, isTrue);
    expect(
      context.motionDuration(const Duration(milliseconds: 300)),
      Duration.zero,
    );
  });
}
