import '../models.dart';
import '../storage/token_storage.dart';

class SessionManager {
  SessionManager(this._storage);

  final TokenStorage _storage;

  String? accessToken;
  String? refreshToken;
  AppUser? user;

  bool get isAuthenticated => accessToken != null;

  Future<void> load() async {
    final data = await _storage.read();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    user = data.user;
  }

  Future<void> setSession(AuthSession session) async {
    user = session.user;
    accessToken = session.accessToken;
    refreshToken = session.refreshToken;
    await _storage.save(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    );
  }

  Future<void> setTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  Future<void> clear() async {
    accessToken = null;
    refreshToken = null;
    user = null;
    await _storage.clear();
  }
}
