/**
 * Base contract for long-lived client services (audio, networking, input,
 * asset management, ...). Services are registered in a {@link ServiceRegistry}
 * and share optional async lifecycle hooks.
 *
 * No concrete services are implemented yet — this is the seam future systems
 * plug into without touching the bootstrap.
 */
export interface Service {
  readonly name: string;
  init?(): void | Promise<void>;
  dispose?(): void | Promise<void>;
}
