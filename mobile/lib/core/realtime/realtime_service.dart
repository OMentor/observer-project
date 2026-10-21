import 'dart:async';

import 'package:socket_io_client/socket_io_client.dart' as io;

const String realtimeBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://localhost:3000',
);

enum RealtimeStatus { connecting, connected, disconnected }

class RealtimeEvent {
  RealtimeEvent(this.name, this.payload);

  final String name;
  final Map<String, dynamic> payload;
}

const List<String> _broadcastEvents = [
  'event.created',
  'event.updated',
  'event.deleted',
  'member.joined',
  'member.updated',
  'member.kicked',
  'token.activated',
  'sync.conflict',
];

class RealtimeService {
  io.Socket? _socket;
  final StreamController<RealtimeEvent> _events =
      StreamController<RealtimeEvent>.broadcast();
  final StreamController<RealtimeStatus> _status =
      StreamController<RealtimeStatus>.broadcast();

  RealtimeStatus _current = RealtimeStatus.disconnected;

  Stream<RealtimeEvent> get events => _events.stream;
  Stream<RealtimeStatus> get status => _status.stream;
  RealtimeStatus get currentStatus => _current;

  bool get isConnected => _current == RealtimeStatus.connected;

  void connect(String token) {
    disconnect();
    _setStatus(RealtimeStatus.connecting);

    final socket = io.io(
      realtimeBaseUrl,
      io.OptionBuilder()
          .setTransports(['polling', 'websocket'])
          .disableAutoConnect()
          .enableForceNew()
          .enableWithCredentials()
          .setReconnectionAttempts(double.infinity)
          .setAuth({'token': token})
          .build(),
    );
    _socket = socket;

    socket.onConnect((_) => _setStatus(RealtimeStatus.connected));
    socket.onDisconnect((_) => _setStatus(RealtimeStatus.disconnected));
    socket.onConnectError((_) => _setStatus(RealtimeStatus.disconnected));

    for (final name in _broadcastEvents) {
      socket.on(name, (data) {
        final payload = data is Map
            ? Map<String, dynamic>.from(data)
            : <String, dynamic>{};
        if (!_events.isClosed) {
          _events.add(RealtimeEvent(name, payload));
        }
      });
    }

    socket.connect();
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _setStatus(RealtimeStatus.disconnected);
  }

  void _setStatus(RealtimeStatus status) {
    _current = status;
    if (!_status.isClosed) {
      _status.add(status);
    }
  }

  void dispose() {
    disconnect();
    _events.close();
    _status.close();
  }
}
