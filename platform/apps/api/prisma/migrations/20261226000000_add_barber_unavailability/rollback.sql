-- T-4209: зворотний хід для недоступності барбера й конфліктів (T-4616a).
-- "ShiftConflict" посилається на візити, а не на "BarberUnavailability",
-- тож порядок drop-у довільний; індекси зникають разом із таблицями.
DROP TABLE IF EXISTS "ShiftConflict";
DROP TABLE IF EXISTS "BarberUnavailability";
