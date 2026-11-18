import { CreateServiceHandler } from './create-service';
import { UpdateServiceHandler } from './update-service';
import { SetServiceActiveHandler } from './set-service-active';
import { ListServicesHandler } from './list-services';
import { FakeServicesRepository } from './services.fakes';

export function setupServices() {
  const services = new FakeServicesRepository();
  return {
    create: new CreateServiceHandler(services),
    update: new UpdateServiceHandler(services),
    setActive: new SetServiceActiveHandler(services),
    list: new ListServicesHandler(services),
    services,
  };
}
