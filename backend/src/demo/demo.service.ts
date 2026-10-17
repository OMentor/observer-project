import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DemoEventSeed {
  sourceKey: 'team' | 'projects' | 'personal';
  title: string;
  day: number;
  time: string;
  minutes: number;
  allDay?: boolean;
  location?: string;
  description?: string;
}

export interface DemoSeedResult {
  created: boolean;
  spaces: number;
  sources: number;
  events: number;
  reason?: string;
}

const DEMO_EVENTS: DemoEventSeed[] = [
  {
    sourceKey: 'team',
    title: 'Планёрка команды',
    day: 1,
    time: '10:00',
    minutes: 30,
    location: 'Zoom',
    description: 'Еженедельный статус',
  },
  { sourceKey: 'team', title: 'Ретроспектива спринта', day: 5, time: '16:00', minutes: 60 },
  {
    sourceKey: 'team',
    title: 'Демо для заказчика',
    day: 12,
    time: '15:00',
    minutes: 60,
    location: 'Переговорная',
    description: 'Показать прогресс',
  },
  { sourceKey: 'team', title: 'Синк с командой', day: 19, time: '11:00', minutes: 45 },
  {
    sourceKey: 'projects',
    title: 'Спринт-планирование',
    day: 2,
    time: '11:00',
    minutes: 90,
    description: 'Оценка задач',
  },
  { sourceKey: 'projects', title: 'Ревью дизайна', day: 8, time: '14:00', minutes: 60 },
  { sourceKey: 'projects', title: 'Релиз v1.0', day: 24, time: '18:00', minutes: 60, location: 'Онлайн' },
  { sourceKey: 'projects', title: 'Воркшоп по архитектуре', day: 30, time: '13:00', minutes: 120 },
  { sourceKey: 'personal', title: 'Тренировка', day: 0, time: '07:30', minutes: 60 },
  { sourceKey: 'personal', title: 'Ужин с семьёй', day: 3, time: '19:00', minutes: 90 },
  { sourceKey: 'personal', title: 'Поход к врачу', day: 9, time: '09:00', minutes: 45, location: 'Клиника' },
  { sourceKey: 'personal', title: 'Звонок родителям', day: 14, time: '20:00', minutes: 30 },
  { sourceKey: 'personal', title: 'Чтение', day: 21, time: '21:00', minutes: 60 },
  {
    sourceKey: 'personal',
    title: 'Кино с друзьями',
    day: 27,
    time: '20:00',
    minutes: 150,
    location: 'Кинотеатр',
  },
  {
    sourceKey: 'personal',
    title: 'Отпуск',
    day: 40,
    time: '00:00',
    minutes: 0,
    allDay: true,
  },
];

export function startOfCurrentQuarter(now: Date): Date {
  const month = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), month, 1, 0, 0, 0, 0);
}

@Injectable()
export class DemoService {
  constructor(private readonly prisma: PrismaService) {}

  async seed(userId: string): Promise<DemoSeedResult> {
    const existingEvents = await this.prisma.event.count({
      where: { creator_id: userId, deleted_at: null },
    });
    if (existingEvents > 0) {
      return {
        created: false,
        spaces: 0,
        sources: 0,
        events: 0,
        reason: 'has-events',
      };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const timezone = user?.timezone ?? 'UTC';
    const quarterStart = startOfCurrentQuarter(new Date());

    const work = await this.prisma.space.create({
      data: {
        owner_id: userId,
        name: 'Работа',
        members: { create: { user_id: userId, preset: 'FULL' } },
      },
    });
    const personal = await this.prisma.space.create({
      data: {
        owner_id: userId,
        name: 'Личное',
        members: { create: { user_id: userId, preset: 'FULL' } },
      },
    });

    const team = await this.prisma.source.create({
      data: { space_id: work.id, name: 'Командный календарь', color: '#5B5FEF' },
    });
    const projects = await this.prisma.source.create({
      data: { space_id: work.id, name: 'Проекты', color: '#F0A030' },
    });
    const personalSource = await this.prisma.source.create({
      data: { space_id: personal.id, name: 'Личное', color: '#34C77B' },
    });

    const sourceIds = {
      team: team.id,
      projects: projects.id,
      personal: personalSource.id,
    };

    const events = DEMO_EVENTS.map((seedEvent) => {
      const start = new Date(quarterStart);
      start.setDate(start.getDate() + seedEvent.day);
      const [hours, minutes] = seedEvent.time.split(':').map(Number);
      start.setHours(hours, minutes, 0, 0);

      const end = new Date(start);
      if (seedEvent.allDay) {
        end.setHours(23, 59, 0, 0);
      } else {
        end.setMinutes(end.getMinutes() + seedEvent.minutes);
      }

      return {
        source_id: sourceIds[seedEvent.sourceKey],
        creator_id: userId,
        title: seedEvent.title,
        description: seedEvent.description ?? null,
        start_at: start,
        end_at: end,
        all_day: seedEvent.allDay ?? false,
        timezone,
        location: seedEvent.location ?? null,
      };
    });

    await this.prisma.event.createMany({ data: events });

    return { created: true, spaces: 2, sources: 3, events: events.length };
  }
}
