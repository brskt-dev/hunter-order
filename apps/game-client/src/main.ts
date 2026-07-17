import Phaser from 'phaser';
import { createGameConfig } from './game/config';

// Single entry point: build the Phaser game bound to the responsive container.
const game = new Phaser.Game(createGameConfig('game-root'));

export default game;
