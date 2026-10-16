import 'package:flutter_test/flutter_test.dart';
import 'package:pletenie_mobile/features/calendar/calendar_range.dart';

void main() {
  group('startOfWeek', () {
    test('неделя начинается с понедельника', () {
      final friday = DateTime(2026, 10, 16);
      expect(friday.weekday, DateTime.friday);
      expect(startOfWeek(friday), DateTime(2026, 10, 12));
    });

    test('понедельник остаётся началом недели', () {
      final monday = DateTime(2026, 10, 12);
      expect(startOfWeek(monday), DateTime(2026, 10, 12));
    });
  });

  group('periodStart / periodEnd', () {
    final anchor = DateTime(2026, 10, 16, 14, 30);

    test('день', () {
      expect(periodStart(CalendarView.day, anchor), DateTime(2026, 10, 16));
      expect(periodEnd(CalendarView.day, anchor), DateTime(2026, 10, 17));
    });

    test('неделя', () {
      expect(periodStart(CalendarView.week, anchor), DateTime(2026, 10, 12));
      expect(periodEnd(CalendarView.week, anchor), DateTime(2026, 10, 19));
    });

    test('месяц', () {
      expect(periodStart(CalendarView.month, anchor), DateTime(2026, 10, 1));
      expect(periodEnd(CalendarView.month, anchor), DateTime(2026, 11, 1));
    });
  });

  group('shiftPeriod', () {
    final anchor = DateTime(2026, 10, 16);

    test('день вперёд/назад', () {
      expect(shiftPeriod(CalendarView.day, anchor, 1), DateTime(2026, 10, 17));
      expect(shiftPeriod(CalendarView.day, anchor, -1), DateTime(2026, 10, 15));
    });

    test('неделя вперёд/назад', () {
      expect(shiftPeriod(CalendarView.week, anchor, 1), DateTime(2026, 10, 19));
      expect(shiftPeriod(CalendarView.week, anchor, -1), DateTime(2026, 10, 5));
    });

    test('месяц вперёд/назад с переходом года', () {
      expect(shiftPeriod(CalendarView.month, anchor, 1), DateTime(2026, 11, 1));
      expect(
        shiftPeriod(CalendarView.month, DateTime(2026, 1, 20), -1),
        DateTime(2025, 12, 1),
      );
    });
  });

  group('overlapsPeriod', () {
    final anchor = DateTime(2026, 10, 16);

    test('событие внутри дня', () {
      expect(
        overlapsPeriod(
          CalendarView.day,
          anchor,
          DateTime(2026, 10, 16, 10),
          DateTime(2026, 10, 16, 11),
        ),
        isTrue,
      );
    });

    test('событие вне дня', () {
      expect(
        overlapsPeriod(
          CalendarView.day,
          anchor,
          DateTime(2026, 10, 17, 10),
          DateTime(2026, 10, 17, 11),
        ),
        isFalse,
      );
    });

    test('событие ночи переходит в день', () {
      expect(
        overlapsPeriod(
          CalendarView.day,
          anchor,
          DateTime(2026, 10, 15, 23),
          DateTime(2026, 10, 16, 1),
        ),
        isTrue,
      );
    });

    test('событие предыдущего месяца пересекает границу месяца', () {
      expect(
        overlapsPeriod(
          CalendarView.month,
          anchor,
          DateTime(2026, 9, 30),
          DateTime(2026, 10, 2),
        ),
        isTrue,
      );
    });

    test('событие ровно на границе (начало периода) включается', () {
      expect(
        overlapsPeriod(
          CalendarView.day,
          anchor,
          DateTime(2026, 10, 16),
          DateTime(2026, 10, 16),
        ),
        isTrue,
      );
    });
  });

  group('periodTitle', () {
    test('день', () {
      expect(
        periodTitle(CalendarView.day, DateTime(2026, 10, 16)),
        '16 октября 2026',
      );
    });

    test('неделя в пределах месяца', () {
      expect(
        periodTitle(CalendarView.week, DateTime(2026, 10, 16)),
        '12–18 октября 2026',
      );
    });

    test('неделя через границу месяцев', () {
      expect(
        periodTitle(CalendarView.week, DateTime(2026, 9, 30)),
        '28 сентября – 4 октября 2026',
      );
    });

    test('месяц', () {
      expect(
        periodTitle(CalendarView.month, DateTime(2026, 10, 16)),
        'Октябрь 2026',
      );
    });
  });

  test('dayLabel', () {
    expect(dayLabel(DateTime(2026, 1, 5)), '5 января 2026');
  });
}
