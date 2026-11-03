import * as THREE from 'three';

export const SPRITE_NAMES = ['menkaburi_stand','menkaburi_walk1','menkaburi_walk2','menkaburi_chase','menkaburi_catch','jizo_sleep','jizo_slip','jizo_awake'];

// assets/sprites/manifest.json(置いた画像の名前の配列)があればそれだけ読む(存在しない画像への 404 を出さないため)。
// manifest が無い/壊れている場合は SPRITE_NAMES を全部試す(無い画像はスキップ)。
async function listSprites(basePath) {
  try {
    const res = await fetch(basePath + 'manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) return SPRITE_NAMES.filter((n) => list.includes(n) || list.includes(n + '.png'));
    }
  } catch (e) { /* fall through */ }
  return SPRITE_NAMES;
}

export async function loadSprites(basePath = 'assets/sprites/') {
  const loader = new THREE.TextureLoader();
  const map = new Map();
  const names = await listSprites(basePath);
  await Promise.all(names.map((name) => new Promise((resolve) => {
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
