/** HTTP mapper for the schedule revision returned by the application use case. */
export class SchedulingHttpMapper {
  static toResponse(version: number) {
    return { version };
  }
}
