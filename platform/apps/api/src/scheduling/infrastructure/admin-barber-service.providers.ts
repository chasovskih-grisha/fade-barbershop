// Nest providers for the admin barber-service IO (T-4521/T-4522). Two group
// providers + one composition provider keep useFactory params <= 3
// (gate max-params) and the file under max-lines.

import { PrismaBarberServiceAssignmentRepository } from './prisma-barber-service-assignment.repository';
import { PrismaSlotPolicyRepository } from './prisma-slot-policy.repository';
import type { BarberServiceAssignmentRepository } from '../domain/ports.barber-service-assignment';
import type { SlotPolicyRepository } from '../domain/ports.slot-policy';
import { ADMIN_BARBER_SERVICE_IO, type AdminBarberServiceDeps } from './admin-barber-service.dto';
import { getSlotPolicy, listForBarberAndLocation, listForServiceAndLocation, saveSlotPolicy, setAssignment } from './admin-barber-service.io';

const ADMIN_MATRIX_IO = Symbol('ADMIN_MATRIX_IO');
const ADMIN_SLOT_POLICY_IO = Symbol('ADMIN_SLOT_POLICY_IO');

type MatrixIo = Pick<
  AdminBarberServiceDeps,
  'listForBarberAndLocation' | 'listForServiceAndLocation' | 'setAssignment'
>;
type PolicyIo = Pick<AdminBarberServiceDeps, 'getSlotPolicy' | 'saveSlotPolicy'>;

export const adminBarberServiceProviders = [
  {
    provide: ADMIN_MATRIX_IO,
    useFactory: (repo: BarberServiceAssignmentRepository): MatrixIo => ({
      listForBarberAndLocation: listForBarberAndLocation(repo),
      listForServiceAndLocation: listForServiceAndLocation(repo),
      setAssignment: setAssignment(repo),
    }),
    inject: [PrismaBarberServiceAssignmentRepository],
  },
  {
    provide: ADMIN_SLOT_POLICY_IO,
    useFactory: (repo: SlotPolicyRepository): PolicyIo => ({
      getSlotPolicy: getSlotPolicy(repo),
      saveSlotPolicy: saveSlotPolicy(repo),
    }),
    inject: [PrismaSlotPolicyRepository],
  },
  {
    provide: ADMIN_BARBER_SERVICE_IO,
    // prettier-ignore
    useFactory: (matrix: MatrixIo, policy: PolicyIo): AdminBarberServiceDeps => ({ ...matrix, ...policy }),
    inject: [ADMIN_MATRIX_IO, ADMIN_SLOT_POLICY_IO],
  },
];
