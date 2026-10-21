import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';

class HomeShell extends ConsumerWidget {
  const HomeShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexFor(location);
    final conflicts =
        ref.watch(conflictsProvider).asData?.value.length ?? 0;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(switch (i) {
          1 => '/spaces',
          2 => '/profile',
          _ => '/',
        }),
        destinations: [
          NavigationDestination(
            icon: Badge(
              isLabelVisible: conflicts > 0,
              label: Text('$conflicts'),
              child: const Icon(Icons.calendar_today),
            ),
            label: 'Календарь',
          ),
          const NavigationDestination(
            icon: Icon(Icons.grid_view),
            label: 'Пространства',
          ),
          const NavigationDestination(icon: Icon(Icons.person), label: 'Профиль'),
        ],
      ),
    );
  }

  int _indexFor(String location) {
    if (location.startsWith('/spaces')) {
      return 1;
    }
    if (location.startsWith('/profile')) {
      return 2;
    }
    return 0;
  }
}
