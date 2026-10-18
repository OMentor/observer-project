import 'package:flutter/material.dart';

import '../palette.dart';

/// Аватар (зеркало `web/src/components/ui/avatar.tsx`): изображение либо
/// инициалы на затемнённом цвете по имени. Размер шрифта — 0.4 от размера.
class AppAvatar extends StatelessWidget {
  const AppAvatar({super.key, required this.name, this.image, this.size = 32});

  final String name;
  final ImageProvider? image;
  final double size;

  @override
  Widget build(BuildContext context) {
    final ImageProvider? source = image;
    if (source != null) {
      return ClipOval(
        child: Image(
          image: source,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, _, _) => _initials(),
        ),
      );
    }
    return _initials();
  }

  Widget _initials() {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: darkenColor(colorForName(name)),
        shape: BoxShape.circle,
      ),
      child: Text(
        initialsFor(name),
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.4,
          fontWeight: FontWeight.w500,
          height: 1,
        ),
      ),
    );
  }
}
