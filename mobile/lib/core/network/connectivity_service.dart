import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum ConnectivityStatus { online, offline }

final connectivityProvider = Provider<Connectivity>((ref) => Connectivity());

/// Текущий сетевой статус устройства. Пока состояние неизвестно, считаем
/// устройство онлайн, чтобы не показывать ложный оффлайн-баннер.
final networkStatusProvider = StreamProvider<ConnectivityStatus>((ref) async* {
  final connectivity = ref.watch(connectivityProvider);

  ConnectivityStatus map(List<ConnectivityResult> results) =>
      results.any((result) => result != ConnectivityResult.none)
      ? ConnectivityStatus.online
      : ConnectivityStatus.offline;

  try {
    yield map(await connectivity.checkConnectivity());
  } catch (_) {
    yield ConnectivityStatus.online;
  }

  yield* connectivity.onConnectivityChanged.map(map);
});

final isOnlineProvider = Provider<bool>((ref) {
  final status = ref.watch(networkStatusProvider).asData?.value;
  return status != ConnectivityStatus.offline;
});
