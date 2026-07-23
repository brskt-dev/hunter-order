import { BenchmarkScene } from './benchmark-scene';
import { BootScene } from './boot-scene';

export { BenchmarkScene } from './benchmark-scene';
export { BootScene } from './boot-scene';

/**
 * Ordered list of scene classes registered with Phaser. The first entry is the
 * scene Phaser starts automatically. BootScene hands off to BenchmarkScene.
 */
export const sceneClasses = [BootScene, BenchmarkScene];
