import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Тон уведомления (зеркало `ToastTone` в `web/src/store/toasts.ts`).
enum ToastTone { info, success, warning, danger }

/// Одно всплывающее уведомление.
class ToastMessage {
  const ToastMessage({
    required this.id,
    required this.title,
    this.description,
    this.tone = ToastTone.info,
  });

  final int id;
  final String title;
  final String? description;
  final ToastTone tone;
}

/// Хранилище уведомлений (зеркало `useToastStore`): TTL 5 c, ручное закрытие.
class ToastController extends Notifier<List<ToastMessage>> {
  static const Duration ttl = Duration(milliseconds: 5000);

  final Map<int, Timer> _timers = {};
  int _seq = 0;

  @override
  List<ToastMessage> build() {
    ref.onDispose(() {
      for (final timer in _timers.values) {
        timer.cancel();
      }
      _timers.clear();
    });
    return const [];
  }

  void push({
    required String title,
    String? description,
    ToastTone tone = ToastTone.info,
  }) {
    final id = ++_seq;
    state = [
      ...state,
      ToastMessage(id: id, title: title, description: description, tone: tone),
    ];
    _timers[id] = Timer(ttl, () => dismiss(id));
  }

  void dismiss(int id) {
    _timers.remove(id)?.cancel();
    state = state.where((toast) => toast.id != id).toList();
  }
}

final toastProvider =
    NotifierProvider<ToastController, List<ToastMessage>>(ToastController.new);
