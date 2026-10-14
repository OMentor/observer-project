import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/auth/session_manager.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final session = SessionManager(TokenStorage());
  await session.load();
  runApp(
    ProviderScope(
      overrides: [sessionManagerProvider.overrideWithValue(session)],
      child: const PletenieApp(),
    ),
  );
}

class PletenieApp extends ConsumerWidget {
  const PletenieApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Плетение',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.dark,
      routerConfig: router,
    );
  }
}
