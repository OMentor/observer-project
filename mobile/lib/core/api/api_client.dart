import 'package:dio/dio.dart';

import '../auth/session_manager.dart';
import '../models.dart';
import 'calendar_data_source.dart';

const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://localhost:3000',
);

class ApiException implements Exception {
  ApiException(this.message, {this.isNetwork = false});
  final String message;
  final bool isNetwork;

  @override
  String toString() => message;
}

class ApiClient implements CalendarDataSource {
  ApiClient({
    required this.session,
    required this.onSessionExpired,
    Dio? dio,
  }) {
    _dio = dio ?? Dio(BaseOptions(baseUrl: apiBaseUrl));
    _dio.options
      ..baseUrl = apiBaseUrl
      ..headers['Content-Type'] = 'application/json'
      ..connectTimeout = const Duration(seconds: 10)
      ..receiveTimeout = const Duration(seconds: 10);

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = session.accessToken;
          if (token != null && !options.path.startsWith('/auth/')) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final response = error.response;
          final options = error.requestOptions;
          final isAuthPath = options.path.startsWith('/auth/');
          final alreadyRetried = options.extra['retried'] == true;

          if (response?.statusCode == 401 && !isAuthPath && !alreadyRetried) {
            final refreshed = await _refresh();
            if (refreshed) {
              options.extra['retried'] = true;
              options.headers['Authorization'] =
                  'Bearer ${session.accessToken}';
              try {
                final retried = await _dio.fetch(options);
                return handler.resolve(retried);
              } catch (_) {
                onSessionExpired();
                return handler.reject(error);
              }
            }
            onSessionExpired();
          }
          handler.next(error);
        },
      ),
    );
  }

  final SessionManager session;
  final void Function() onSessionExpired;
  late final Dio _dio;

  Future<bool> _refresh() async {
    final refreshToken = session.refreshToken;
    if (refreshToken == null) {
      return false;
    }
    try {
      final refreshDio = Dio(BaseOptions(baseUrl: apiBaseUrl));
      final res = await refreshDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = res.data;
      if (data == null) {
        return false;
      }
      await session.setTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Never _throw(DioException error) {
    final response = error.response;
    final data = response?.data;
    if (data is Map && data['message'] != null) {
      final message = data['message'];
      throw ApiException(
        message is List ? message.join(', ') : message.toString(),
      );
    }
    throw ApiException(
      'Ошибка сети. Проверьте подключение.',
      isNetwork: response == null,
    );
  }

  Future<T> _guard<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on DioException catch (error) {
      _throw(error);
    }
  }

  Future<AuthSession> login(String email, String password) => _guard(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/auth/login',
          data: {'email': email, 'password': password},
        );
        return AuthSession.fromJson(res.data!);
      });

  Future<AuthSession> register(
    String name,
    String email,
    String password,
  ) =>
      _guard(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/auth/register',
          data: {'name': name, 'email': email, 'password': password},
        );
        return AuthSession.fromJson(res.data!);
      });

  Future<void> logout(String refreshToken) async {
    try {
      await _dio.post('/auth/logout', data: {'refreshToken': refreshToken});
    } on DioException {
      // logout is best-effort
    }
  }

  @override
  Future<List<Space>> fetchSpaces() => _guard(() async {
        final res = await _dio.get<List<dynamic>>('/spaces');
        return res.data!
            .map((e) => Space.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  Future<Space> fetchSpace(String id) => _guard(() async {
        final res = await _dio.get<Map<String, dynamic>>('/spaces/$id');
        return Space.fromJson(res.data!);
      });

  Future<Space> createSpace(String name) => _guard(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/spaces',
          data: {'name': name},
        );
        return Space.fromJson(res.data!);
      });

  Future<void> deleteSpace(String id) =>
      _guard(() => _dio.delete<void>('/spaces/$id'));

  Future<Source> createSource(
    String spaceId, {
    required String name,
    String? color,
    String visibility = 'SHARED',
  }) =>
      _guard(() async {
        final data = <String, dynamic>{
          'name': name,
          'visibility': visibility,
        };
        if (color != null) {
          data['color'] = color;
        }
        final res = await _dio.post<Map<String, dynamic>>(
          '/spaces/$spaceId/sources',
          data: data,
        );
        return Source.fromJson(res.data!);
      });

  Future<void> deleteSource(String id) =>
      _guard(() => _dio.delete<void>('/sources/$id'));

  @override
  Future<List<CalendarEvent>> fetchEvents(String sourceId) => _guard(() async {
        final res =
            await _dio.get<List<dynamic>>('/sources/$sourceId/events');
        return res.data!
            .map((e) => CalendarEvent.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  Future<CalendarEvent> createEvent(
    String sourceId,
    EventPayload payload,
  ) =>
      _guard(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/sources/$sourceId/events',
          data: payload.toJson(),
        );
        return CalendarEvent.fromJson(res.data!);
      });

  Future<CalendarEvent> updateEvent(
    String id,
    EventPayload payload,
  ) =>
      _guard(() async {
        final res = await _dio.patch<Map<String, dynamic>>(
          '/events/$id',
          data: payload.toJson(),
        );
        return CalendarEvent.fromJson(res.data!);
      });

  Future<void> deleteEvent(String id) =>
      _guard(() => _dio.delete<void>('/events/$id'));

  Future<List<EventHistoryEntry>> fetchEventHistory(String eventId) =>
      _guard(() async {
        final res =
            await _dio.get<List<dynamic>>('/events/$eventId/history');
        return res.data!
            .map((e) => EventHistoryEntry.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  Future<List<Member>> fetchMembers(String spaceId) => _guard(() async {
        final res = await _dio.get<List<dynamic>>('/spaces/$spaceId/members');
        return res.data!
            .map((e) => Member.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  Future<Member> updateMember(String memberId, String preset) =>
      _guard(() async {
        final res = await _dio.patch<Map<String, dynamic>>(
          '/members/$memberId',
          data: {'preset': preset},
        );
        return Member.fromJson(res.data!);
      });

  Future<void> removeMember(String memberId) =>
      _guard(() => _dio.delete<void>('/members/$memberId'));

  Future<List<Token>> fetchTokens(String spaceId) => _guard(() async {
        final res = await _dio.get<List<dynamic>>('/spaces/$spaceId/tokens');
        return res.data!
            .map((e) => Token.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  Future<Token> createToken(
    String spaceId, {
    required String preset,
    String? expiresAt,
  }) =>
      _guard(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/spaces/$spaceId/tokens',
          data: {'preset': preset, 'expires_at': expiresAt},
        );
        return Token.fromJson(res.data!);
      });

  Future<List<Token>> batchTokens({
    required String spaceId,
    required String preset,
    required int count,
    String? expiresAt,
  }) =>
      _guard(() async {
        final res = await _dio.post<List<dynamic>>(
          '/tokens/batch',
          data: {
            'space_id': spaceId,
            'preset': preset,
            'count': count,
            'expires_at': expiresAt,
          },
        );
        return res.data!
            .map((e) => Token.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  Future<TokenActivation> activateToken(
    String token, {
    String? name,
  }) =>
      _guard(() async {
        final res = await _dio.post<Map<String, dynamic>>(
          '/tokens/$token/activate',
          data: {'name': name},
        );
        return TokenActivation.fromJson(res.data!);
      });

  Future<void> revokeToken(String id) =>
      _guard(() => _dio.delete<void>('/tokens/$id'));
}
