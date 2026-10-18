import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import 'app_card.dart';

/// Карточка-список: набор строк [AppListRow], разделённых тонкими линиями.
class AppListCard extends StatelessWidget {
  const AppListCard({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) {
        rows.add(Divider(height: 1, thickness: 1, color: c.borderSubtle));
      }
      rows.add(children[i]);
    }
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(mainAxisSize: MainAxisSize.min, children: rows),
    );
  }
}

/// Строка списка: необязательные leading/trailing, заголовок и подпись.
class AppListRow extends StatelessWidget {
  const AppListRow({
    super.key,
    this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  final Widget? leading;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final content = Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.x4,
        vertical: AppSpacing.x3,
      ),
      child: Row(
        children: [
          if (leading != null) ...[
            leading!,
            const SizedBox(width: AppSpacing.x3),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: AppTypography.body.copyWith(
                    color: c.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.x1),
                    child: Text(
                      subtitle!,
                      style: AppTypography.bodySmall.copyWith(
                        color: c.textSecondary,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: AppSpacing.x3),
            trailing!,
          ],
        ],
      ),
    );

    return Material(
      color: Colors.transparent,
      child: onTap == null
          ? content
          : InkWell(onTap: onTap, child: content),
    );
  }
}
