export interface BarberPhotoDto {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface BarberDto {
  id: string;
  name: string;
  any?: boolean; // true for the virtual "any barber" entry
  photo?: BarberPhotoDto | null;
  locationName?: string | undefined;
}
