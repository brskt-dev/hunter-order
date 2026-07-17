/**
 * Typed publish/subscribe event bus.
 *
 * Generic over an event map `M` (event name -> payload type), giving
 * compile-time safety on both `emit` and `on`. Dependency-free and framework
 * agnostic — this is the application-level bus, distinct from Phaser's
 * per-scene emitter.
 */

export type EventHandler<Payload> = (payload: Payload) => void;
export type Unsubscribe = () => void;

export class EventBus<M> {
  private readonly handlers = new Map<keyof M, Set<EventHandler<unknown>>>();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof M>(event: K, handler: EventHandler<M[K]>): Unsubscribe {
    const set = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.handlers.set(event, set);
    return () => this.off(event, handler);
  }

  /** Subscribe to the next occurrence only. Returns an unsubscribe function. */
  once<K extends keyof M>(event: K, handler: EventHandler<M[K]>): Unsubscribe {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off<K extends keyof M>(event: K, handler: EventHandler<M[K]>): void {
    const set = this.handlers.get(event);
    if (!set) {
      return;
    }
    set.delete(handler as EventHandler<unknown>);
    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  emit<K extends keyof M>(event: K, payload: M[K]): void {
    const set = this.handlers.get(event);
    if (!set) {
      return;
    }
    // Copy to tolerate handlers that unsubscribe during dispatch.
    for (const handler of [...set]) {
      (handler as EventHandler<M[K]>)(payload);
    }
  }

  clear<K extends keyof M>(event?: K): void {
    if (event === undefined) {
      this.handlers.clear();
    } else {
      this.handlers.delete(event);
    }
  }

  listenerCount<K extends keyof M>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}
