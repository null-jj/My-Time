import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'dtr-adjustment-test-'));
process.env.TURSO_CONNECTION_URL = `file:${join(directory, 'test.db')}`;
delete process.env.TURSO_AUTH_TOKEN;

const { db } = await import('../lib/db/config');
const { createChangeRequest, reviewChangeRequest } = await import('../lib/time-change-requests');
const { timeEntries } = await import('../lib/db/schema');
const { eq } = await import('drizzle-orm');
after(() => {
  db.$client.close();
  rmSync(directory, { recursive: true });
});

test('approval moves the date with clock-in and preserves it for other changes', async () => {
  await db.run(`CREATE TABLE time_entries (
    id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT NOT NULL,
    date TEXT NOT NULL, time_in TEXT NOT NULL, time_out TEXT, note TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
  await db.run(`CREATE TABLE time_change_requests (
    id INTEGER PRIMARY KEY, time_entry_id INTEGER NOT NULL, user_id TEXT NOT NULL,
    org_id TEXT NOT NULL, requested_time_in TEXT, requested_time_out TEXT,
    requested_note TEXT, reason TEXT NOT NULL, status TEXT NOT NULL,
    reviewed_by TEXT, reviewed_at TEXT, review_note TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);

  for (const [id, requestedTimeIn, expectedDate] of [
    [2460, '2026-10-11T08:00:00.000Z', '2026-10-11'],
    [2462, '2026-10-09T00:00:00.000Z', '2026-10-09'],
    [2463, '2026-10-11T09:00:00.000Z', '2026-10-11'],
    [2464, '2026-10-11T12:30:00.000Z', '2026-10-11'],
  ] satisfies [number, string, string][]) {
    await db.insert(timeEntries).values({
      id, userId: 'test-user', orgId: 'test-org', date: '2026-10-12',
      timeIn: '2026-10-12T08:00:00.000Z', timeOut: '2026-10-12T16:00:00.000Z',
      note: 'Original note', createdAt: '2026-10-12T08:00:00.000Z',
      updatedAt: '2026-10-12T16:00:00.000Z',
    });
    const request = await createChangeRequest('test-user', 'test-org', id, {
      requestedTimeIn, reason: 'Correct the work date',
    });
    await reviewChangeRequest(request.id, 'test-admin', 'test-org', 'approved');
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    assert.equal(entry.date, expectedDate, `entry ${id} calendar date`);
    assert.equal(entry.timeIn, requestedTimeIn);
    assert.equal(entry.timeOut, '2026-10-12T16:00:00.000Z');
    assert.equal(entry.note, 'Original note');
  }

  for (const [changes, action] of [
    [{ requestedTimeOut: '2026-10-12T18:00:00.000Z' }, 'approved'],
    [{ requestedNote: 'Corrected note' }, 'approved'],
    [{ requestedTimeIn: '2026-10-08T08:00:00.000Z' }, 'rejected'],
  ] satisfies [{ requestedTimeIn?: string; requestedTimeOut?: string; requestedNote?: string }, 'approved' | 'rejected'][]) {
    const request = await createChangeRequest('test-user', 'test-org', 2460, {
      ...changes, reason: 'Test other review actions',
    });
    const reviewed = await reviewChangeRequest(request.id, 'test-admin', 'test-org', action);
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, 2460));
    assert.equal(entry.date, '2026-10-11');
    assert.equal(entry.timeIn, '2026-10-11T08:00:00.000Z');
    assert.equal(reviewed.status, action);
    if (action === 'approved' && changes.requestedTimeOut) assert.equal(entry.timeOut, changes.requestedTimeOut);
    if (action === 'approved' && changes.requestedNote) assert.equal(entry.note, changes.requestedNote);
    await assert.rejects(reviewChangeRequest(request.id, 'test-admin', 'test-org', 'approved'), /Pending request not found/);
  }
});
