import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Локальные (системные) уведомления об изменениях в календаре.
///
/// Все обращения к плагину обёрнуты в try/catch: на платформах/тестах, где
/// плагин недоступен, приложение продолжает работать без уведомлений.
class NotificationService {
  NotificationService({FlutterLocalNotificationsPlugin? plugin})
    : _plugin = plugin ?? FlutterLocalNotificationsPlugin();

  final FlutterLocalNotificationsPlugin _plugin;
  bool _ready = false;

  bool get isReady => _ready;

  Future<void> init() async {
    if (_ready) {
      return;
    }
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    );
    try {
      await _plugin.initialize(settings: settings);
      _ready = true;
      await _requestPermissions();
    } catch (_) {
      _ready = false;
    }
  }

  Future<void> _requestPermissions() async {
    try {
      await _plugin
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.requestNotificationsPermission();
    } catch (_) {
      // разрешения недоступны — не критично
    }
  }

  Future<void> show({required String title, required String body}) async {
    if (!_ready) {
      return;
    }
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'pletenie_events',
        'События',
        channelDescription: 'Уведомления об изменениях в календаре',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    try {
      await _plugin.show(
        id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title: title,
        body: body,
        notificationDetails: details,
      );
    } catch (_) {
      // уведомление не показано — не критично
    }
  }
}
