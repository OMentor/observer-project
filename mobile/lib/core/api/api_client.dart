import 'package:dio/dio.dart';

const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://localhost:3000',
);

class ApiClient {
  ApiClient({Dio? dio}) : dio = dio ?? Dio(BaseOptions(baseUrl: apiBaseUrl));

  final Dio dio;

  void setToken(String? token) {
    if (token == null) {
      dio.options.headers.remove('Authorization');
    } else {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }
}
