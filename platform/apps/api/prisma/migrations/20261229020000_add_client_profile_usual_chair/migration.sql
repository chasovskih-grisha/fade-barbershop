-- T-4725: звична локація і звичний барбер у профілі клієнта.
-- Обидва поля необов'язкові: порожнє значення — реальний вибір «Не обрано».
-- FK немає навмисно — id може перестати резолвитись (локацію закрили),
-- профіль це переживає, а UI показує «Більше не доступно» і дає очистити.
ALTER TABLE "ClientProfile" ADD COLUMN "usualLocationId" UUID;
ALTER TABLE "ClientProfile" ADD COLUMN "usualBarberId" UUID;
