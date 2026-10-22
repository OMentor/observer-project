import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/api/api_client.dart';
import 'core/auth/session_manager.dart';
import 'core/models.dart';
import 'core/network/connectivity_service.dart';
import 'core/notifications/notification_service.dart';
import 'core/realtime/realtime_service.dart';
import 'core/repository/calendar_repository.dart';
import 'core/storage/calendar_cache.dart';
import 'core/storage/sqlite_calendar_cache.dart';
import 'core/storage/token_storage.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/activate/activate_screen.dart';
import 'features/calendar/calendar_screen.dart';
import 'features/members/members_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/spaces/space_screen.dart';
import 'features/spaces/spaces_screen.dart';
import 'features/sync/conflict_resolve_screen.dart';
import 'features/sync/conflicts_screen.dart';
import 'features/tokens/tokens_screen.dart';
import 'shared/toast.dart';
import 'shared/widgets/home_shell.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final sessionManagerProvider = Provider<SessionManager>(
  (ref) => SessionManager(ref.read(tokenStorageProvider)),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    session: ref.read(sessionManagerProvider),
    onSessionExpired: () {
      ref.read(authControllerProvider.notifier).expire();
    },
  );
});

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AppUser?>(AuthController.new);

class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ThemeMode.system;

  void set(ThemeMode mode) => state = mode;
}

final themeModeProvider =
    NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

class LastSyncedNotifier extends Notifier<DateTime?> {
  @override
  DateTime? build() => null;

  void set(DateTime value) => state = value;
}

final lastSyncedAtProvider =
    NotifierProvider<LastSyncedNotifier, DateTime?>(LastSyncedNotifier.new);

final notificationServiceProvider =
    Provider<NotificationService>((ref) => NotificationService());

final calendarCacheProvider = Provider<CalendarCache>(
  (ref) => SqliteCalendarCache(
    onLastSynced: (value) =>
        ref.read(lastSyncedAtProvider.notifier).set(value),
  ),
);

final calendarRepositoryProvider = Provider<CalendarRepository>(
  (ref) => CalendarRepository(
    source: ref.watch(apiClientProvider),
    cache: ref.watch(calendarCacheProvider),
  ),
);

final spacesProvider = FutureProvider<List<Space>>(
  (ref) => ref.read(calendarRepositoryProvider).loadSpaces(),
);

final spaceProvider = FutureProvider.family<Space, String>(
  (ref, id) => ref.read(apiClientProvider).fetchSpace(id),
);

final eventsProvider = FutureProvider.family<List<CalendarEvent>, String>(
  (ref, sourceId) => ref.read(apiClientProvider).fetchEvents(sourceId),
);

final allEventsProvider = FutureProvider<List<CalendarEvent>>(
  (ref) => ref.read(calendarRepositoryProvider).loadAllEvents(),
);

final membersProvider = FutureProvider.family<List<Member>, String>(
  (ref, spaceId) => ref.read(apiClientProvider).fetchMembers(spaceId),
);

final tokensProvider = FutureProvider.family<List<Token>, String>(
  (ref, spaceId) => ref.read(apiClientProvider).fetchTokens(spaceId),
);

final eventHistoryProvider =
    FutureProvider.family<List<EventHistoryEntry>, String>(
  (ref, eventId) =>
      ref.read(apiClientProvider).fetchEventHistory(eventId),
);

final conflictsProvider = FutureProvider<List<ConflictItem>>((ref) async {
  final page = await ref.read(apiClientProvider).fetchConflicts();
  return page.items;
});

final conflictProvider =
    FutureProvider.autoDispose.family<ConflictItem, String>(
  (ref, id) => ref.read(apiClientProvider).fetchConflict(id),
);

final spacePresetProvider = FutureProvider.family<String?, String>(
  (ref, spaceId) async {
    final user = ref.watch(authControllerProvider).asData?.value;
    if (user == null) {
      return null;
    }
    final members = await ref.watch(membersProvider(spaceId).future);
    for (final member in members) {
      if (member.userId == user.id) {
        return member.preset;
      }
    }
    return null;
  },
);

final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  final service = RealtimeService();
  ref.onDispose(service.dispose);
  return service;
});

class RealtimeController extends Notifier<RealtimeStatus> {
  @override
  RealtimeStatus build() {
    final service = ref.watch(realtimeServiceProvider);
    final user = ref.watch(authControllerProvider).asData?.value;

    final statusSub = service.status.listen((status) => state = status);
    ref.onDispose(statusSub.cancel);

    final eventSub = service.events.listen(_onEvent);
    ref.onDispose(eventSub.cancel);

    if (user == null) {
      service.disconnect();
    } else {
      final token = ref.read(sessionManagerProvider).accessToken;
      if (token != null) {
        service.connect(token);
      }
    }
    return service.currentStatus;
  }

  void _onEvent(RealtimeEvent event) {
    final me = ref.read(authControllerProvider).asData?.value?.id;
    final name = event.name;
    if (name == 'sync.conflict') {
      ref.invalidate(conflictsProvider);
      ref.invalidate(allEventsProvider);
      final title = event.payload['title'] as String?;
      _notify(
        title == null || title.isEmpty
            ? 'Конфликт синхронизации'
            : 'Конфликт синхронизации: «$title»',
      );
    } else if (name.startsWith('event.')) {
      ref.invalidate(allEventsProvider);
      _notifyEvent(name, event.payload, me);
    } else if (name.startsWith('member.') || name == 'token.activated') {
      ref.invalidate(spacesProvider);
      ref.invalidate(membersProvider);
      if (name == 'token.activated') {
        ref.invalidate(tokensProvider);
      }
      _notifyMember(name, event.payload, me);
    }
  }

  void _notifyEvent(String name, Map<String, dynamic> payload, String? me) {
    final data = payload['event'];
    final map = data is Map ? data : const <String, dynamic>{};
    if (map['creator_id'] == me) {
      return;
    }
    switch (name) {
      case 'event.created':
        _notify('Новое событие: ${map['title'] ?? ''}');
      case 'event.updated':
        _notify('Событие обновлено');
      case 'event.deleted':
        _notify('Событие удалено');
    }
  }

  void _notifyMember(String name, Map<String, dynamic> payload, String? me) {
    if (name == 'member.kicked') {
      _notify(
        payload['user_id'] == me
            ? 'Доступ к пространству отозван'
            : 'Участник удалён из пространства',
      );
    } else if (name == 'token.activated' && payload['user_id'] != me) {
      _notify('Новый участник присоединился');
    }
  }

  void _notify(String message) {
    ref.read(toastProvider.notifier).push(title: message);
    ref.read(notificationServiceProvider).show(
          title: 'Плетение',
          body: message,
        );
  }
}

final realtimeStatusProvider =
    NotifierProvider<RealtimeController, RealtimeStatus>(RealtimeController.new);

/// Следит за восстановлением сети: повторно загружает данные и уведомляет
/// пользователя. Также подхватывает отметку последней синхронизации из кэша.
class SyncController extends Notifier<void> {
  @override
  void build() {
    _seedLastSynced();

    ref.listen<bool>(isOnlineProvider, (previous, next) {
      if (previous == false && next == true) {
        ref.read(toastProvider.notifier).push(
              title: 'Соединение восстановлено — обновляем данные',
              tone: ToastTone.success,
            );
        ref.invalidate(spacesProvider);
        ref.invalidate(allEventsProvider);
      }
    });
  }

  Future<void> _seedLastSynced() async {
    try {
      final value = await ref.read(calendarCacheProvider).readLastSyncedAt();
      if (value != null) {
        ref.read(lastSyncedAtProvider.notifier).set(value);
      }
    } catch (_) {
      // кэш ещё не создан — не критично
    }
  }
}

final syncStatusProvider =
    NotifierProvider<SyncController, void>(SyncController.new);

class _RouterRefresh extends ChangeNotifier {
  void notify() => notifyListeners();
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefresh();
  ref.listen(authControllerProvider, (_, _) => refresh.notify());

  final router = GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      if (auth.isLoading) {
        return null;
      }
      final loggedIn = auth.asData?.value != null;
      final location = state.matchedLocation;
      final onAuthPage = location == '/login' || location == '/register';
      if (!loggedIn && !onAuthPage) {
        return '/login';
      }
      if (loggedIn && onAuthPage) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      ShellRoute(
        builder: (_, _, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, _) => const CalendarScreen()),
          GoRoute(path: '/spaces', builder: (_, _) => const SpacesScreen()),
          GoRoute(
            path: '/spaces/:id',
            builder: (_, state) =>
                SpaceScreen(spaceId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/spaces/:id/tokens',
            builder: (_, state) =>
                TokensScreen(spaceId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/spaces/:id/members',
            builder: (_, state) =>
                MembersScreen(spaceId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/sync/conflicts',
            builder: (_, _) => const ConflictsScreen(),
          ),
          GoRoute(
            path: '/sync/conflicts/:id',
            builder: (_, state) =>
                ConflictResolveScreen(conflictId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/activate/:token',
            builder: (_, state) =>
                ActivateScreen(token: state.pathParameters['token']!),
          ),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
        ],
      ),
    ],
  );

  ref.onDispose(() {
    refresh.dispose();
    router.dispose();
  });
  return router;
});
