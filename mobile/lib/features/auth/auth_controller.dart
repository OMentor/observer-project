import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app.dart';

class AuthController extends AsyncNotifier<String?> {
  @override
  Future<String?> build() async {
    return ref.read(tokenStorageProvider).readAccessToken();
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncLoading();
    try {
      await ref.read(tokenStorageProvider).saveAccessToken('stub-token');
      ref.read(apiClientProvider).setToken('stub-token');
      state = const AsyncData('stub-token');
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }

  Future<void> signOut() async {
    await ref.read(tokenStorageProvider).clear();
    ref.read(apiClientProvider).setToken(null);
    state = const AsyncData(null);
  }
}
