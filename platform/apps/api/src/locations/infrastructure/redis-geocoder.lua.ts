// Lua-скрипти сховищ геокодера (Redis; ADR 0050). Винесені в окремий файл,
// щоб не роздувати основний файл адаптера.

export const RATE_LIMIT_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
if redis.call('ZCARD', key) >= max then return 0 end
redis.call('ZADD', key, now, now .. ':' .. math.random(1, 1e9))
redis.call('PEXPIRE', key, window)
return 1
`;

export const TOMBSTONE_LUA = `
local failures = KEYS[1]
local tombstone = KEYS[2]
local threshold = tonumber(ARGV[1])
local duration = tonumber(ARGV[2])
local count = redis.call('INCR', failures)
redis.call('PEXPIRE', failures, duration)
if count >= threshold then
  redis.call('SET', tombstone, '1', 'PX', duration)
  redis.call('DEL', failures)
end
return count
`;

export const EXPUNGE_LUA = `return redis.call('DEL', KEYS[1])`;
