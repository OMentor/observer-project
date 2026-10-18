import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../core/api/api_client.dart';
import '../../core/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_field.dart';
import '../../shared/widgets/app_input.dart';

class ActivateScreen extends ConsumerStatefulWidget {
  const ActivateScreen({super.key, required this.token});

  final String token;

  @override
  ConsumerState<ActivateScreen> createState() => _ActivateScreenState();
}

class _ActivateScreenState extends ConsumerState<ActivateScreen> {
  late final TextEditingController _name;
  bool _busy = false;
  String? _error;
  TokenActivation? _result;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).asData?.value;
    _name = TextEditingController(text: user?.name ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Приглашение')),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.x5),
        child: _result != null ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  Widget _buildSuccess() {
    final result = _result!;
    final c = AppColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Icon(Icons.check_circle, size: 56, color: c.success),
        const SizedBox(height: AppSpacing.x4),
        Text(
          'Готово! Вы присоединились к пространству.',
          textAlign: TextAlign.center,
          style: AppTypography.body.copyWith(color: c.textPrimary),
        ),
        const SizedBox(height: AppSpacing.x2),
        Text(
          'Ваш пресет: ${Preset.label(result.preset)}.',
          textAlign: TextAlign.center,
          style: AppTypography.bodySmall.copyWith(color: c.textSecondary),
        ),
        const SizedBox(height: AppSpacing.x6),
        AppButton(
          label: 'К пространству',
          expanded: true,
          onPressed: () => context.go('/spaces/${result.spaceId}'),
        ),
        const SizedBox(height: AppSpacing.x2),
        AppButton(
          label: 'В календарь',
          variant: AppButtonVariant.secondary,
          expanded: true,
          onPressed: () => context.go('/'),
        ),
      ],
    );
  }

  Widget _buildForm() {
    final c = AppColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Активация токена доступа к пространству',
          style: AppTypography.h3.copyWith(color: c.textPrimary),
        ),
        const SizedBox(height: AppSpacing.x4),
        AppField(
          label: 'Ваше имя',
          helper: 'Как вас показывать участникам',
          child: AppTextField(controller: _name),
        ),
        if (_error != null) ...[
          const SizedBox(height: AppSpacing.x3),
          Text(
            _error!,
            style: AppTypography.bodySmall.copyWith(color: c.danger),
          ),
        ],
        const SizedBox(height: AppSpacing.x5),
        AppButton(
          label: 'Активировать',
          expanded: true,
          loading: _busy,
          onPressed: _busy ? null : _activate,
        ),
      ],
    );
  }

  Future<void> _activate() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(apiClientProvider)
          .activateToken(widget.token, name: _name.text.trim());
      ref.invalidate(spacesProvider);
      if (mounted) {
        setState(() => _result = result);
      }
    } on ApiException catch (error) {
      if (mounted) {
        setState(() => _error = error.message);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }
}
