import 'package:flutter/material.dart';

import 'app_button.dart';

/// Диалог подтверждения (аналог `AlertDialog` + `Dialog` из web). Возвращает
/// `true`, если пользователь подтвердил, иначе `false`.
Future<bool> showAppConfirm(
  BuildContext context, {
  required String title,
  String? message,
  String confirmLabel = 'Подтвердить',
  String cancelLabel = 'Отмена',
  bool danger = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: message == null ? null : Text(message),
      actions: [
        AppButton(
          label: cancelLabel,
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          onPressed: () => Navigator.pop(ctx, false),
        ),
        AppButton(
          label: confirmLabel,
          variant:
              danger ? AppButtonVariant.danger : AppButtonVariant.primary,
          size: AppButtonSize.sm,
          onPressed: () => Navigator.pop(ctx, true),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// Диалог ввода одной строки (например, имя пространства/источника).
/// Возвращает введённый текст или `null`, если пользователь отменил.
Future<String?> showAppPrompt(
  BuildContext context, {
  required String title,
  String? label,
  String? hintText,
  String? initialValue,
  String confirmLabel = 'Ок',
  String cancelLabel = 'Отмена',
  String? Function(String value)? validator,
  bool obscure = false,
}) {
  return showDialog<String>(
    context: context,
    builder: (ctx) => _PromptDialog(
      title: title,
      label: label,
      hintText: hintText,
      initialValue: initialValue,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      validator: validator,
      obscure: obscure,
    ),
  );
}

class _PromptDialog extends StatefulWidget {
  const _PromptDialog({
    required this.title,
    this.label,
    this.hintText,
    this.initialValue,
    required this.confirmLabel,
    required this.cancelLabel,
    this.validator,
    this.obscure = false,
  });

  final String title;
  final String? label;
  final String? hintText;
  final String? initialValue;
  final String confirmLabel;
  final String cancelLabel;
  final String? Function(String value)? validator;
  final bool obscure;

  @override
  State<_PromptDialog> createState() => _PromptDialogState();
}

class _PromptDialogState extends State<_PromptDialog> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initialValue);
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final value = _controller.text.trim();
    final error = widget.validator?.call(value);
    if (error != null) {
      setState(() => _error = error);
      return;
    }
    Navigator.pop(context, value);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: TextField(
        controller: _controller,
        autofocus: true,
        obscureText: widget.obscure,
        textInputAction: TextInputAction.done,
        onSubmitted: (_) => _submit(),
        onChanged: (_) {
          if (_error != null) {
            setState(() => _error = null);
          }
        },
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hintText,
          errorText: _error,
        ),
      ),
      actions: [
        AppButton(
          label: widget.cancelLabel,
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          onPressed: () => Navigator.pop(context),
        ),
        AppButton(
          label: widget.confirmLabel,
          size: AppButtonSize.sm,
          onPressed: _submit,
        ),
      ],
    );
  }
}
