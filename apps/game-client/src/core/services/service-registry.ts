import { assertDefined } from '@shared/utils';

import type { Service } from './service';

/**
 * Minimal service locator. Registration order is preserved so `initAll` runs in
 * declaration order and `disposeAll` unwinds in reverse.
 */
export class ServiceRegistry {
  private readonly services = new Map<string, Service>();
  private readonly order: string[] = [];

  register(service: Service): void {
    if (this.services.has(service.name)) {
      throw new Error(`Service already registered: ${service.name}`);
    }
    this.services.set(service.name, service);
    this.order.push(service.name);
  }

  get<T extends Service>(name: string): T {
    return assertDefined(
      this.services.get(name) as T | undefined,
      `Service not registered: ${name}`,
    );
  }

  tryGet<T extends Service>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  async initAll(): Promise<void> {
    for (const name of this.order) {
      await this.services.get(name)?.init?.();
    }
  }

  async disposeAll(): Promise<void> {
    for (const name of [...this.order].reverse()) {
      await this.services.get(name)?.dispose?.();
    }
    this.services.clear();
    this.order.length = 0;
  }

  get size(): number {
    return this.services.size;
  }
}
