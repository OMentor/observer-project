import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexFor(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(switch (i) {
          1 => '/spaces',
          2 => '/profile',
          _ => '/',
        }),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.calendar_today),
            label: 'Календарь',
          ),
          NavigationDestination(
            icon: Icon(Icons.grid_view),
            label: 'Пространства',
          ),
          NavigationDestination(icon: Icon(Icons.person), label: 'Профиль'),
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
