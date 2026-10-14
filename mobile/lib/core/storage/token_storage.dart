import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models.dart';

class TokenStorage {
  static const _accessKey = 'pletenie.access_token';
  static const _refreshKey = 'pletenie.refresh_token';
  static const _userKey = 'pletenie.user';

  Future<
      ({
        String? accessToken,
        String? refreshToken,
        AppUser? user,
      })> read() async {
    final prefs = await SharedPreferences.getInstance();
    final rawUser = prefs.getString(_userKey);
    return (
      accessToken: prefs.getString(_accessKey),
      refreshToken: prefs.getString(_refreshKey),
      user: rawUser == null
          ? null
          : AppUser.fromJson(jsonDecode(rawUser) as Map<String, dynamic>),
    );
  }

  Future<void> save({
    required String accessToken,
    required String refreshToken,
    required AppUser user,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, accessToken);
    await prefs.setString(_refreshKey, refreshToken);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, accessToken);
    await prefs.setString(_refreshKey, refreshToken);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
    await prefs.remove(_userKey);
  }
}
