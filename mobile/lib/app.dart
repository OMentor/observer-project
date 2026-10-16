import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/api/api_client.dart';
import 'core/auth/session_manager.dart';
import 'core/models.dart';
import 'core/realtime/realtime_service.dart';
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
import 'features/tokens/tokens_screen.dart';
import 'shared/global_keys.dart';
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

final spacesProvider = FutureProvider<List<Space>>(
  (ref) => ref.read(apiClientProvider).fetchSpaces(),
);

final spaceProvider = FutureProvider.family<Space, String>(
  (ref, id) => ref.read(apiClientProvider).fetchSpace(id),
);

final eventsProvider = FutureProvider.family<List<CalendarEvent>, String>(
  (ref, sourceId) => ref.read(apiClientProvider).fetchEvents(sourceId),
);

final allEventsProvider = FutureProvider<List<CalendarEvent>>((ref) async {
  final api = ref.read(apiClientProvider);
  final spaces = await api.fetchSpaces();
  final sources = spaces.expand((s) => s.sources);
  final lists = await Future.wait(sources.map((s) => api.fetchEvents(s.id)));
  final events = lists.expand((e) => e).toList();
  events.sort((a, b) => a.startAt.compareTo(b.startAt));
  return events;
});

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
    if (name.startsWith('event.')) {
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
        _snack('Новое событие: ${map['title'] ?? ''}');
      case 'event.updated':
        _snack('Событие обновлено');
      case 'event.deleted':
        _snack('Событие удалено');
    }
  }

  void _notifyMember(String name, Map<String, dynamic> payload, String? me) {
    if (name == 'member.kicked') {
      _snack(
        payload['user_id'] == me
            ? 'Доступ к пространству отозван'
            : 'Участник удалён из пространства',
      );
    } else if (name == 'token.activated' && payload['user_id'] != me) {
      _snack('Новый участник присоединился');
    }
  }

  void _snack(String message) {
    scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

final realtimeStatusProvider =
    NotifierProvider<RealtimeController, RealtimeStatus>(RealtimeController.new);

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
