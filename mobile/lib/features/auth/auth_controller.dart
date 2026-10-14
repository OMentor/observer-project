import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';
import '../../core/models.dart';

class AuthController extends AsyncNotifier<AppUser?> {
  @override
  Future<AppUser?> build() async {
    final session = ref.read(sessionManagerProvider);
    await session.load();
    return session.user;
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncLoading();
    final session = ref.read(sessionManagerProvider);
    try {
      final result = await ref.read(apiClientProvider).login(email, password);
      await session.setSession(result);
      state = AsyncData(result.user);
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }

  Future<void> register(String name, String email, String password) async {
    state = const AsyncLoading();
    final session = ref.read(sessionManagerProvider);
    try {
      final result =
          await ref.read(apiClientProvider).register(name, email, password);
      await session.setSession(result);
      state = AsyncData(result.user);
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }

  Future<void> signOut() async {
    final session = ref.read(sessionManagerProvider);
    final refreshToken = session.refreshToken;
    if (refreshToken != null) {
      await ref.read(apiClientProvider).logout(refreshToken);
    }
    await session.clear();
    state = const AsyncData(null);
  }

  Future<void> expire() async {
    await ref.read(sessionManagerProvider).clear();
    state = const AsyncData(null);
  }
}
