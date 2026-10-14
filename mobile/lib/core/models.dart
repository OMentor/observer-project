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
      );
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
