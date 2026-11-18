// Публічний DTO локації флоу запису. Структура має збігатися з тим, що
// реально повертаєlocations API (toLocationDto): chairs — масив крісел,
// тому поле тут не декларується як число.
export interface LocationDto {
  id: string;
  name: string;
  address: string;
}
