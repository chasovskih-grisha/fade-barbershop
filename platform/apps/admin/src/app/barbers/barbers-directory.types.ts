export interface BarberPhotoDto {
  url: string;
  alt: string;
  consentAt: string | null;
  consentBy: string | null;
  updatedAt: string;
}

export interface Barber {
  id: string;
  name: string | null;
  phone: string;
  active: boolean;
  selfSchedule: boolean;
  photo: BarberPhotoDto | null;
}

export interface BarbersLocation {
  id: string;
  name: string;
}
