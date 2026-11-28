-- T-4209: зворотний хід для звичної локації/барбера в профілі (T-4725).
ALTER TABLE "ClientProfile" DROP COLUMN "usualBarberId";
ALTER TABLE "ClientProfile" DROP COLUMN "usualLocationId";
