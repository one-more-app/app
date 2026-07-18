import { countPersonalRecords } from '../lib/count-personal-records.js';

describe('countPersonalRecords', () => {
  it('compte chaque record battu sur un exercice suivi', () => {
    const count = countPersonalRecords([
      {
        id: '1',
        trackedExerciseId: 'ex-a',
        date: '2024-01-01',
        weight: 50,
        reps: 8,
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: '2',
        trackedExerciseId: 'ex-a',
        date: '2024-01-02',
        weight: 55,
        reps: 8,
        updatedAt: new Date('2024-01-02T10:00:00Z'),
      },
      {
        id: '3',
        trackedExerciseId: 'ex-a',
        date: '2024-01-03',
        weight: 55,
        reps: 10,
        updatedAt: new Date('2024-01-03T10:00:00Z'),
      },
      {
        id: '4',
        trackedExerciseId: 'ex-a',
        date: '2024-01-04',
        weight: 50,
        reps: 12,
        updatedAt: new Date('2024-01-04T10:00:00Z'),
      },
    ]);

    expect(count).toBe(3);
  });

  it('additionne les records sur plusieurs exercices', () => {
    const count = countPersonalRecords([
      {
        id: '1',
        trackedExerciseId: 'ex-a',
        date: '2024-01-01',
        weight: 40,
        reps: 5,
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: '2',
        trackedExerciseId: 'ex-b',
        date: '2024-01-01',
        weight: 60,
        reps: 5,
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      },
    ]);

    expect(count).toBe(2);
  });
});
