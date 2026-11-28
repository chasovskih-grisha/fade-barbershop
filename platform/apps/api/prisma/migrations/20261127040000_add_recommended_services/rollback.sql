-- T-4209: зворотний хід для блоку «рекомендуємо» (T-4445).
-- Обидві таблиці створені цією міграцією; індекси зникають разом із ними.
DROP TABLE IF EXISTS "RecommendedServiceMetric";
DROP TABLE IF EXISTS "RecommendedServicesConfig";
