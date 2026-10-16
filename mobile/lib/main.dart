import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/auth/session_manager.dart';
import 'core/notifications/notification_service.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'shared/global_keys.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final session = SessionManager(TokenStorage());
  await session.load();
  final notifications = NotificationService();
  await notifications.init();
  runApp(
    ProviderScope(
      overrides: [
        sessionManagerProvider.overrideWithValue(session),
        notificationServiceProvider.overrideWithValue(notifications),
      ],
      child: const PletenieApp(),
    ),
  );
}

class PletenieApp extends ConsumerWidget {
  const PletenieApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    ref.watch(realtimeStatusProvider);
    ref.watch(syncStatusProvider);
    return MaterialApp.router(
      title: 'Плетение',
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: scaffoldMessengerKey,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
