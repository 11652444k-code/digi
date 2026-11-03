import * as THREE from 'three';

export const SPRITE_NAMES = ['menkaburi_stand','menkaburi_walk1','menkaburi_walk2','menkaburi_chase','menkaburi_catch','jizo_sleep','jizo_slip','jizo_awake'];

export async function loadSprites(basePath = 'assets/sprites/') {
  const loader = new THREE.TextureLoader();
  const map = new Map();
  await Promise.all(SPRITE_NAMES.map((name) => new Promise((resolve) => {
    try {
      loader.load(
        basePath + name + '.png',
        (tex) => { tex.colorSpace = THREE.SRGBColorSpace; map.set(name, tex); resolve(); },
        undefined,
        () => resolve()
      );
    } catch (e) { resolve(); }
  })));
  return map;
}

export function makeBillboard(texture, heightMeters) {
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: 0.1 });
  const sprite = new THREE.Sprite(mat);
  sprite.center.set(0.5, 0);
  const img = texture.image;
  const aspect = img && img.width && img.height ? img.width / img.height : 1;
  sprite.scale.set(heightMeters * aspect, heightMeters, 1);
  return sprite;
}
