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

    // Première perf = baseline ; seules les 2 perfs qui battent le PB comptent.
    expect(count).toBe(2);
  });

  it("n'ajoute pas la première perf de chaque exercice comme record", () => {
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

    expect(count).toBe(0);
  });

  it('compte un record uniquement après une perf qui bat le PB', () => {
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
        trackedExerciseId: 'ex-a',
        date: '2024-01-02',
        weight: 45,
        reps: 5,
        updatedAt: new Date('2024-01-02T10:00:00Z'),
      },
      {
        id: '3',
        trackedExerciseId: 'ex-b',
        date: '2024-01-01',
        weight: 60,
        reps: 5,
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      },
    ]);

    expect(count).toBe(1);
  });
});
