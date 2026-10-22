class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.timezone,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String timezone;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        role: json['role'] as String,
        timezone: json['timezone'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'timezone': timezone,
      };
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final AppUser user;
  final String accessToken;
  final String refreshToken;

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        user: AppUser.fromJson(json['user'] as Map<String, dynamic>),
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
      );
}

class Source {
  const Source({
    required this.id,
    required this.spaceId,
    required this.ownerId,
    required this.name,
    required this.color,
    required this.visibility,
    required this.createdAt,
  });

  final String id;
  final String spaceId;
  final String? ownerId;
  final String name;
  final String color;
  final String visibility;
  final String createdAt;

  factory Source.fromJson(Map<String, dynamic> json) => Source(
        id: json['id'] as String,
        spaceId: json['space_id'] as String,
        ownerId: json['owner_id'] as String?,
        name: json['name'] as String,
        color: json['color'] as String? ?? '#5B5FEF',
        visibility: json['visibility'] as String? ?? 'SHARED',
        createdAt: json['created_at'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'space_id': spaceId,
        'owner_id': ownerId,
        'name': name,
        'color': color,
        'visibility': visibility,
        'created_at': createdAt,
      };
}

class Space {
  const Space({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.createdAt,
    this.deletedAt,
    this.sources = const [],
  });

  final String id;
  final String name;
  final String ownerId;
  final String createdAt;
  final String? deletedAt;
  final List<Source> sources;

  factory Space.fromJson(Map<String, dynamic> json) => Space(
        id: json['id'] as String,
        name: json['name'] as String,
        ownerId: json['owner_id'] as String,
        createdAt: json['created_at'] as String,
        deletedAt: json['deleted_at'] as String?,
        sources: (json['sources'] as List<dynamic>?)
                ?.map((e) => Source.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'owner_id': ownerId,
        'created_at': createdAt,
        'deleted_at': deletedAt,
        'sources': sources.map((s) => s.toJson()).toList(),
      };
}

class Preset {
  static const String full = 'FULL';
  static const String own = 'OWN';
  static const String busy = 'BUSY';
  static const String read = 'READ';

  static const List<String> all = [full, own, busy, read];

  static const Map<String, String> labels = {
    full: 'Полный доступ',
    own: 'Свои события',
    busy: 'Только занятость',
    read: 'Только чтение',
  };

  static const Map<String, String> hints = {
    full: 'Создание и изменение любых событий и источников.',
    own: 'Изменение только своих событий, остальные — скрыты.',
    busy: 'Видно лишь «Занято», без деталей.',
    read: 'Полный просмотр без права изменений.',
  };

  static String label(String? value) => labels[value] ?? value ?? '—';
}

class CalendarEvent {
  const CalendarEvent({
    required this.id,
    required this.sourceId,
    required this.creatorId,
    required this.title,
    required this.startAt,
    required this.endAt,
    required this.allDay,
    required this.timezone,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.location,
    this.rrule,
    this.busy = false,
    this.syncStatus = 'local',
  });

  final String id;
  final String sourceId;
  final String creatorId;
  final String title;
  final String? description;
  final DateTime startAt;
  final DateTime endAt;
  final bool allDay;
  final String timezone;
  final String? location;
  final String? rrule;
  final String createdAt;
  final String updatedAt;
  final bool busy;
  final String syncStatus;

  bool get hasConflict => syncStatus == 'conflict';

  factory CalendarEvent.fromJson(Map<String, dynamic> json) => CalendarEvent(
        id: json['id'] as String,
        sourceId: json['source_id'] as String,
        creatorId: json['creator_id'] as String,
        title: json['title'] as String,
        description: json['description'] as String?,
        startAt: DateTime.parse(json['start_at'] as String).toLocal(),
        endAt: DateTime.parse(json['end_at'] as String).toLocal(),
        allDay: json['all_day'] as bool? ?? false,
        timezone: json['timezone'] as String? ?? 'UTC',
        location: json['location'] as String?,
        rrule: json['rrule'] as String?,
        createdAt: json['created_at'] as String,
        updatedAt: json['updated_at'] as String,
        busy: json['busy'] as bool? ?? false,
        syncStatus: json['sync_status'] as String? ?? 'local',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'source_id': sourceId,
        'creator_id': creatorId,
        'title': title,
        'description': description,
        'start_at': startAt.toUtc().toIso8601String(),
        'end_at': endAt.toUtc().toIso8601String(),
        'all_day': allDay,
        'timezone': timezone,
        'location': location,
        'rrule': rrule,
        'created_at': createdAt,
        'updated_at': updatedAt,
        'busy': busy,
        'sync_status': syncStatus,
      };
}

class Token {
  const Token({
    required this.id,
    required this.spaceId,
    required this.preset,
    required this.createdBy,
    required this.createdAt,
    this.expiresAt,
    this.usedAt,
    this.usedBy,
    this.revokedAt,
    this.token,
    this.creatorName,
  });

  final String id;
  final String spaceId;
  final String preset;
  final String createdBy;
  final String createdAt;
  final String? expiresAt;
  final String? usedAt;
  final String? usedBy;
  final String? revokedAt;
  final String? token;
  final String? creatorName;

  bool get revoked => revokedAt != null;
  bool get used => usedAt != null;
  bool get expired =>
      expiresAt != null && DateTime.parse(expiresAt!).isBefore(DateTime.now());

  String get statusLabel {
    if (revoked) return 'Отозван';
    if (used) return 'Использован';
    if (expired) return 'Истёк';
    return 'Активен';
  }

  factory Token.fromJson(Map<String, dynamic> json) => Token(
        id: json['id'] as String,
        spaceId: json['space_id'] as String,
        preset: json['preset'] as String,
        createdBy: json['created_by'] as String,
        createdAt: json['created_at'] as String,
        expiresAt: json['expires_at'] as String?,
        usedAt: json['used_at'] as String?,
        usedBy: json['used_by'] as String?,
        revokedAt: json['revoked_at'] as String?,
        token: json['token'] as String?,
        creatorName:
            (json['creator'] as Map<String, dynamic>?)?['name'] as String?,
      );
}

class Member {
  const Member({
    required this.id,
    required this.spaceId,
    required this.userId,
    required this.preset,
    required this.joinedAt,
    required this.userName,
    required this.userEmail,
    this.revokedAt,
  });

  final String id;
  final String spaceId;
  final String userId;
  final String preset;
  final String joinedAt;
  final String userName;
  final String userEmail;
  final String? revokedAt;

  factory Member.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? const {};
    return Member(
      id: json['id'] as String,
      spaceId: json['space_id'] as String,
      userId: json['user_id'] as String,
      preset: json['preset'] as String,
      joinedAt: json['joined_at'] as String,
      userName: user['name'] as String? ?? '',
      userEmail: user['email'] as String? ?? '',
      revokedAt: json['revoked_at'] as String?,
    );
  }
}

class TokenActivation {
  const TokenActivation({
    required this.success,
    required this.spaceId,
    required this.preset,
  });

  final bool success;
  final String spaceId;
  final String preset;

  factory TokenActivation.fromJson(Map<String, dynamic> json) =>
      TokenActivation(
        success: json['success'] as bool? ?? true,
        spaceId: json['space_id'] as String,
        preset: json['preset'] as String,
      );
}

class EventHistoryEntry {
  const EventHistoryEntry({
    required this.id,
    required this.action,
    required this.createdAt,
    required this.userName,
    this.oldTitle,
    this.newTitle,
  });

  final String id;
  final String action;
  final String createdAt;
  final String userName;
  final String? oldTitle;
  final String? newTitle;

  String get actionLabel => switch (action) {
        'CREATED' => 'Создано',
        'UPDATED' => 'Изменено',
        'DELETED' => 'Удалено',
        _ => action,
      };

  factory EventHistoryEntry.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? const {};
    final oldData = json['old_data'] as Map<String, dynamic>?;
    final newData = json['new_data'] as Map<String, dynamic>?;
    return EventHistoryEntry(
      id: json['id'] as String,
      action: json['action'] as String,
      createdAt: json['created_at'] as String,
      userName: user['name'] as String? ?? '',
      oldTitle: oldData?['title']?.toString(),
      newTitle: newData?['title']?.toString(),
    );
  }
}

class EventPayload {
  const EventPayload({
    required this.title,
    required this.startAt,
    required this.endAt,
    this.allDay = false,
    this.timezone = 'UTC',
    this.location,
    this.description,
  });

  final String title;
  final DateTime startAt;
  final DateTime endAt;
  final bool allDay;
  final String timezone;
  final String? location;
  final String? description;

  Map<String, dynamic> toJson() => {
        'title': title,
        'start_at': startAt.toUtc().toIso8601String(),
        'end_at': endAt.toUtc().toIso8601String(),
        'all_day': allDay,
        'timezone': timezone,
        'location': location,
        'description': description,
      };
}

/// Как разрешить конфликт синхронизации (совпадает с backend-контрактом).
enum ConflictResolution {
  local('local'),
  external('external'),
  merged('merged');

  const ConflictResolution(this.wire);

  final String wire;

  static ConflictResolution? fromWire(String? value) {
    for (final resolution in ConflictResolution.values) {
      if (resolution.wire == value) {
        return resolution;
      }
    }
    return null;
  }
}

/// Снимок полей события в одной из версий конфликта.
class EventSnapshot {
  const EventSnapshot({
    required this.title,
    required this.startAt,
    required this.endAt,
    required this.allDay,
    this.description,
    this.timezone,
    this.location,
    this.rrule,
  });

  final String title;
  final String? description;
  final DateTime startAt;
  final DateTime endAt;
  final bool allDay;
  final String? timezone;
  final String? location;
  final String? rrule;

  factory EventSnapshot.fromJson(Map<String, dynamic> json) => EventSnapshot(
        title: json['title'] as String? ?? '',
        description: json['description'] as String?,
        startAt: DateTime.parse(json['start_at'] as String).toLocal(),
        endAt: DateTime.parse(json['end_at'] as String).toLocal(),
        allDay: json['all_day'] as bool? ?? false,
        timezone: json['timezone'] as String?,
        location: json['location'] as String?,
        rrule: json['rrule'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'start_at': startAt.toUtc().toIso8601String(),
        'end_at': endAt.toUtc().toIso8601String(),
        'all_day': allDay,
        'timezone': timezone,
        'location': location,
        'rrule': rrule,
      };
}

/// Краткая ссылка на событие, к которому относится конфликт.
class ConflictEventRef {
  const ConflictEventRef({
    required this.id,
    required this.title,
    required this.sourceId,
  });

  final String id;
  final String title;
  final String sourceId;

  factory ConflictEventRef.fromJson(Map<String, dynamic> json) =>
      ConflictEventRef(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        sourceId: json['source_id'] as String,
      );
}

/// Неразрешённый конфликт между локальной и внешней версией события.
class ConflictItem {
  const ConflictItem({
    required this.id,
    required this.eventId,
    required this.localData,
    required this.externalData,
    required this.createdAt,
    required this.event,
    this.connectionId,
    this.externalEtag,
    this.resolution,
    this.resolvedAt,
  });

  final String id;
  final String eventId;
  final String? connectionId;
  final EventSnapshot localData;
  final EventSnapshot externalData;
  final String? externalEtag;
  final ConflictResolution? resolution;
  final DateTime? resolvedAt;
  final DateTime createdAt;
  final ConflictEventRef event;

  factory ConflictItem.fromJson(Map<String, dynamic> json) => ConflictItem(
        id: json['id'] as String,
        eventId: json['event_id'] as String,
        connectionId: json['connection_id'] as String?,
        localData: EventSnapshot.fromJson(
          json['local_data'] as Map<String, dynamic>,
        ),
        externalData: EventSnapshot.fromJson(
          json['external_data'] as Map<String, dynamic>,
        ),
        externalEtag: json['external_etag'] as String?,
        resolution: ConflictResolution.fromWire(json['resolution'] as String?),
        resolvedAt: json['resolved_at'] == null
            ? null
            : DateTime.parse(json['resolved_at'] as String).toLocal(),
        createdAt:
            DateTime.parse(json['created_at'] as String).toLocal(),
        event: ConflictEventRef.fromJson(
          json['event'] as Map<String, dynamic>,
        ),
      );
}

/// Страница списка конфликтов (`GET /sync/conflicts`).
class ConflictList {
  const ConflictList({
    required this.items,
    required this.limit,
    required this.offset,
  });

  final List<ConflictItem> items;
  final int limit;
  final int offset;

  factory ConflictList.fromJson(Map<String, dynamic> json) => ConflictList(
        items: (json['items'] as List<dynamic>? ?? const [])
            .map((e) => ConflictItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        limit: json['limit'] as int? ?? 50,
        offset: json['offset'] as int? ?? 0,
      );
}
