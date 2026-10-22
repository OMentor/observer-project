import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/motion/motion.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../toast.dart';

/// Контейнер уведомлений поверх приложения (зеркало `Toaster` +
/// `useToastStore` из web). Оборачивает дерево приложения в [MaterialApp.builder].
class AppToastHost extends ConsumerWidget {
  const AppToastHost({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toasts = ref.watch(toastProvider);
    return Stack(
      children: [
        child,
        if (toasts.isNotEmpty)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.x4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (final toast in toasts)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.x3),
                        child: _ToastCard(toast: toast),
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ToastCard extends ConsumerStatefulWidget {
  const _ToastCard({required this.toast});

  final ToastMessage toast;

  @override
  ConsumerState<_ToastCard> createState() => _ToastCardState();
}

class _ToastCardState extends ConsumerState<_ToastCard> {
  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final toast = widget.toast;
    final (IconData icon, Color color) = switch (toast.tone) {
      ToastTone.info => (Icons.info_outline, c.accent),
      ToastTone.success => (Icons.check_circle_outline, c.success),
      ToastTone.warning => (Icons.warning_amber_rounded, c.amber),
      ToastTone.danger => (Icons.error_outline, c.danger),
    };

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420),
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: context.motionDuration(AppMotion.normal),
        curve: AppMotion.easeOutExpo,
        builder: (context, value, child) => Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset((1 - value) * 24, 0),
            child: child,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.x4),
            decoration: BoxDecoration(
              color: c.bgSurface,
              borderRadius: AppRadius.allLg,
              border: Border.all(color: c.border),
              boxShadow: AppShadows.dropdown,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(icon, size: 20, color: color),
                ),
                const SizedBox(width: AppSpacing.x3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        toast.title,
                        style: AppTypography.body.copyWith(
                          color: c.textPrimary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (toast.description != null)
                        Padding(
                          padding: const EdgeInsets.only(top: AppSpacing.x1),
                          child: Text(
                            toast.description!,
                            style: AppTypography.bodySmall.copyWith(
                              color: c.textSecondary,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.x2),
                Semantics(
                  label: 'Закрыть',
                  button: true,
                  child: IconButton(
                    onPressed: () =>
                        ref.read(toastProvider.notifier).dismiss(toast.id),
                    icon: const Icon(Icons.close, size: 16),
                    color: c.textMuted,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(
                      minWidth: 24,
                      minHeight: 24,
                    ),
                    splashRadius: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
