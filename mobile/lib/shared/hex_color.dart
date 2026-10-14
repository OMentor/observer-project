import 'package:flutter/material.dart';

Color hexColor(String hex, {Color fallback = const Color(0xFF5B5FEF)}) {
  var value = hex.replaceAll('#', '').trim();
  if (value.length == 6) {
    value = 'FF$value';
  }
  final parsed = int.tryParse(value, radix: 16);
  return parsed == null ? fallback : Color(parsed);
}
