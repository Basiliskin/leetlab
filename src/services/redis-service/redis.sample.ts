import { RedisEmulation } from "./redis.service";

export const runRedisTest = async () => {
  const redis = new RedisEmulation({
    maxmemory: 512 * 1024, // ~512 KB (estimated)
    maxmemoryPolicy: "allkeys-lru", // or volatile-lru / *-random / noeviction
  });

  const res = await redis
    .multi()
    .set("counter", "0")
    .incr("counter")
    .incr("counter")
    .get("counter")
    .exec();
  console.log(res);
  // ["OK", 1, 2, "2"]

  await redis.watch("balance");
  const tx = redis.multi().set("balance", "50");
  const result = await tx.exec(); // null => conflict, retry
  console.log(result);

  // --- Tab A: subscriber ---
  const sub = new RedisEmulation();
  sub.on("message", (ch, msg) => console.log("message:", ch, msg));
  sub.on("pmessage", (pat, ch, msg) => console.log("pmessage:", pat, ch, msg));
  await sub.subscribe("news");
  await sub.psubscribe("alerts:*");

  // --- Tab B: publisher (open in a second tab) ---
  const pub = new RedisEmulation();
  await pub.publish("news", "hello world"); // → Tab A logs it
  await pub.publish("alerts:cpu", "95%"); // → matches "alerts:*"

  redis.memoryUsage(); // approximate bytes used
  await redis.configSet("maxmemory", "262144"); // change at runtime
  await redis.configSet("maxmemory-policy", "volatile-lru");
  // When over the limit, writes evict the least-recently-used key(s);
  // with "noeviction" they throw: "OOM command not allowed..."
};
