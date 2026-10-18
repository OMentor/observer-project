import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/core/theme/app_tokens.dart';
import 'package:pletenie_mobile/shared/palette.dart';
import 'package:pletenie_mobile/shared/widgets/app_avatar.dart';
import 'package:pletenie_mobile/shared/widgets/app_badge.dart';
import 'package:pletenie_mobile/shared/widgets/app_button.dart';
import 'package:pletenie_mobile/shared/widgets/app_card.dart';
import 'package:pletenie_mobile/shared/widgets/app_chip.dart';
import 'package:pletenie_mobile/shared/widgets/app_dropdown.dart';
import 'package:pletenie_mobile/shared/widgets/app_field.dart';
import 'package:pletenie_mobile/shared/widgets/app_icon_button.dart';
import 'package:pletenie_mobile/shared/widgets/app_input.dart';
import 'package:pletenie_mobile/shared/widgets/app_select.dart';
import 'package:pletenie_mobile/shared/widgets/app_skeleton.dart';
import 'package:pletenie_mobile/shared/widgets/app_switch.dart';
import 'package:pletenie_mobile/shared/widgets/app_tooltip.dart';
import 'package:pletenie_mobile/shared/widgets/preset_badge.dart';

Widget host(Widget child, {Brightness brightness = Brightness.dark}) {
  return MaterialApp(
    theme: brightness == Brightness.dark ? AppTheme.dark() : AppTheme.light(),
    home: Scaffold(body: Center(child: child)),
  );
}

void main() {
  group('палитра', () {
    test('colorForName детерминирован и входит в палитру', () {
      expect(colorForName('Иван'), colorForName('Иван'));
      expect(appPalette, contains(colorForName('Плетение')));
    });

    test('initialsFor', () {
      expect(initialsFor('Иван Петров'), 'ИП');
      expect(initialsFor('Иван'), 'ИВ');
      expect(initialsFor('   '), '?');
    });

    test('darkenColor затемняет', () {
      final darkened = darkenColor(const Color(0xFF808080));
      expect(darkened.r, lessThan(0.6));
      expect(darkened.a, 1.0);
    });
  });

  group('AppButton', () {
    testWidgets('нажимается', (tester) async {
      var taps = 0;
      await tester.pumpWidget(host(AppButton(label: 'Войти', onPressed: () => taps++)));
      await tester.tap(find.text('Войти'));
      expect(taps, 1);
    });

    testWidgets('в загрузке показывает индикатор и не нажимается', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        host(AppButton(label: 'Войти', loading: true, onPressed: () => taps++)),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.tap(find.text('Войти'));
      expect(taps, 0);
    });

    testWidgets('expanded растягивается', (tester) async {
      await tester.pumpWidget(host(AppButton(label: 'Ок', expanded: true)));
      final width = tester.getSize(find.byType(FilledButton)).width;
      expect(width, greaterThan(300));
    });

    testWidgets('danger использует цвет danger', (tester) async {
      await tester.pumpWidget(
        host(AppButton(label: 'Удалить', variant: AppButtonVariant.danger)),
      );
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      final bg = button.style!.backgroundColor!.resolve(<WidgetState>{});
      expect(bg, AppColors.dark.danger);
    });
  });

  group('AppIconButton', () {
    testWidgets('нажимается и имеет метку', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        host(AppIconButton(icon: Icons.close, label: 'Закрыть', onPressed: () => taps++)),
      );
      await tester.tap(find.byType(IconButton));
      expect(taps, 1);
      expect(find.byTooltip('Закрыть'), findsOneWidget);
    });
  });

  group('AppBadge / PresetBadge', () {
    testWidgets('показывает текст', (tester) async {
      await tester.pumpWidget(host(const AppBadge(label: 'Активен', tone: AppBadgeTone.success)));
      expect(find.text('Активен'), findsOneWidget);
    });

    testWidgets('пресеты имеют русские подписи', (tester) async {
      await tester.pumpWidget(
        host(const Column(children: [
          PresetBadge(preset: 'FULL'),
          PresetBadge(preset: 'OWN'),
          PresetBadge(preset: 'BUSY'),
          PresetBadge(preset: 'READ'),
        ])),
      );
      expect(find.text('Полный'), findsOneWidget);
      expect(find.text('Свои'), findsOneWidget);
      expect(find.text('Занят'), findsOneWidget);
      expect(find.text('Чтение'), findsOneWidget);
    });
  });

  group('AppChip', () {
    testWidgets('удаляется по кнопке', (tester) async {
      var removed = false;
      await tester.pumpWidget(
        host(AppChip(label: 'Дом', onRemove: () => removed = true)),
      );
      await tester.tap(find.byIcon(Icons.close));
      expect(removed, isTrue);
    });
  });

  group('AppAvatar', () {
    testWidgets('инициалы для имени', (tester) async {
      await tester.pumpWidget(host(const AppAvatar(name: 'Иван Петров')));
      expect(find.text('ИП'), findsOneWidget);
    });

    testWidgets('вопрос при пустом имени', (tester) async {
      await tester.pumpWidget(host(const AppAvatar(name: '')));
      expect(find.text('?'), findsOneWidget);
    });
  });

  group('AppField / AppTextField', () {
    testWidgets('label, helper и error', (tester) async {
      await tester.pumpWidget(
        host(const AppField(
          label: 'Название',
          helper: 'Подсказка',
          child: AppTextField(hintText: 'Введите'),
        )),
      );
      expect(find.text('Название'), findsOneWidget);
      expect(find.text('Подсказка'), findsOneWidget);
    });

    testWidgets('ошибка у поля имеет красную рамку', (tester) async {
      await tester.pumpWidget(
        host(const AppTextField(hintText: 'E-mail', error: true)),
      );
      final field = tester.widget<TextField>(find.byType(TextField));
      final border = field.decoration!.enabledBorder! as OutlineInputBorder;
      expect(border.borderSide.color, AppColors.dark.danger);
    });
  });

  group('AppSelect', () {
    testWidgets('выбор пункта', (tester) async {
      String? picked;
      await tester.pumpWidget(
        host(AppSelect<String>(
          value: null,
          onChanged: (v) => picked = v,
          items: const [
            AppSelectItem(value: 'SHARED', label: 'Общий'),
            AppSelectItem(value: 'PRIVATE', label: 'Личный'),
          ],
        )),
      );
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Личный').last);
      await tester.pumpAndSettle();
      expect(picked, 'PRIVATE');
    });
  });

  group('AppCard', () {
    testWidgets('нажимается', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        host(AppCard(onTap: () => taps++, child: const Text('Карточка'))),
      );
      await tester.tap(find.text('Карточка'));
      expect(taps, 1);
    });
  });

  group('AppSkeleton', () {
    testWidgets('статичен при уменьшенном движении', (tester) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: host(const AppSkeleton(width: 120)),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(AppSkeleton), findsOneWidget);
    });
  });

  group('AppSwitch', () {
    testWidgets('переключает значение', (tester) async {
      var value = false;
      await tester.pumpWidget(
        host(
          StatefulBuilder(
            builder: (context, setState) => AppSwitch(
              value: value,
              onChanged: (v) => setState(() => value = v),
            ),
          ),
        ),
      );
      await tester.tap(find.byType(AppSwitch));
      await tester.pumpAndSettle();
      expect(value, isTrue);
    });
  });

  group('AppTooltip', () {
    testWidgets('содержит подсказку', (tester) async {
      await tester.pumpWidget(
        host(const AppTooltip(message: 'Подсказка', child: Icon(Icons.info))),
      );
      expect(find.byType(Tooltip), findsOneWidget);
      expect(
        tester.widget<Tooltip>(find.byType(Tooltip)).message,
        'Подсказка',
      );
    });
  });

  group('AppDropdown', () {
    testWidgets('пункт вызывает обработчик', (tester) async {
      var selected = false;
      await tester.pumpWidget(
        host(AppDropdown(
          trigger: const Icon(Icons.more_vert),
          items: [AppDropdownItem(label: 'Выйти', onSelect: () => selected = true)],
        )),
      );
      await tester.tap(find.byIcon(Icons.more_vert));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Выйти'));
      await tester.pumpAndSettle();
      expect(selected, isTrue);
    });
  });
}
