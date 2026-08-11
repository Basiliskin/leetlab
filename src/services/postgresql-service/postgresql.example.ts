import {
  AsyncLock,
  InMemoryStorage,
  Table,
  TransactionId,
  TransactionManager,
} from "./postgresql.service";

export async function demonstrateMVCC() {
  // 1. Setup Infrastructure
  const lock = new AsyncLock();
  const storage = new InMemoryStorage();
  const txManager = new TransactionManager(lock);
  const usersTable = new Table(
    "users",
    { tableName: "users", columns: { id: "uuid", name: "string" } },
    storage,
  );

  // 2. TX1 Starts and Inserts "Alice"
  const tx1 = txManager.begin();
  const aliceId = usersTable.insert(new TransactionId(tx1.txId), {
    name: "Alice",
  });
  console.log(`[TX1] Inserted Alice (ID: ${aliceId})`);

  // 3. TX2 Starts BEFORE TX1 Commits
  const tx2 = txManager.begin();
  let visibleToTx2 = storage.getTuples("users").filter((t) => tx2.isVisible(t));
  console.log(
    `[TX2] Sees ${visibleToTx2.length} users. (Expected: 0, Alice is uncommitted)`,
  );

  // 4. TX1 Commits
  await txManager.commit(tx1.txId);
  console.log(`[TX1] Committed.`);

  // 5. TX2 STILL cannot see Alice (Snapshot Isolation / Repeatable Read)
  visibleToTx2 = storage.getTuples("users").filter((t) => tx2.isVisible(t));
  console.log(
    `[TX2] Sees ${visibleToTx2.length} users. (Expected: 0, TX2 snapshot was taken before commit)`,
  );

  // 6. TX3 Starts AFTER TX1 Commits
  const tx3 = txManager.begin();
  let visibleToTx3 = storage.getTuples("users").filter((t) => tx3.isVisible(t));
  console.log(
    `[TX3] Sees ${visibleToTx3.length} users. (Expected: 1, Alice is now visible)`,
  );
}
