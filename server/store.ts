import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface PersistedState {
  users: any[];
  accounts: any[];
  jobs: any[];
  tasks: any[];
  enterprise: any;
  brands: any[];
  members: any[];
  collaborationRule: any;
  permissionsMatrix: any[];
}

export interface StateStore {
  read(): PersistedState;
  save(state: PersistedState): void;
  close(): void;
}

export function createStateStore(databasePath: string, initialState: PersistedState): StateStore {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const readRow = () => database.prepare('SELECT payload FROM app_state WHERE id = 1').get() as { payload?: string } | undefined;
  const row = readRow();
  let state: PersistedState = row?.payload ? JSON.parse(row.payload) : structuredClone(initialState);

  const save = (nextState: PersistedState) => {
    state = structuredClone(nextState);
    database
      .prepare(`
        INSERT INTO app_state (id, payload, updated_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
      `)
      .run(JSON.stringify(state), new Date().toISOString());
  };

  if (!row?.payload) save(state);

  return {
    read: () => structuredClone(state),
    save,
    close: () => database.close()
  };
}
