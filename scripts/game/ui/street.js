/**
 * 通りの帯（Canvas）。人物は職業の絵文字で右→左へ歩く。
 * StreetPerson.x: 0（右端で出現）→ 1（左端で消滅）。
 */
import { JOBS } from '../data/jobs.js';

const HIT_RADIUS = 28; // css px
const MARGIN = 18;     // 画面外から歩いて入ってくる余白（css px）
const FADE_MS = 300;

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{render(state:object, now:number):void, hitTest(clientX:number, clientY:number, state:object):string|null,
 *            screenPoint(person:object):{x:number,y:number}|null, fadeOut(person:object, now:number):void}}
 */
export function createStreet(canvas) {
  const ctx = canvas.getContext('2d');
  let cssW = 0;
  let cssH = 0;
  const ghosts = []; // 勧誘直後のフェードアウト演出 { job, px, py, start }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return false;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    cssW = w;
    cssH = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  /** 人物のキャンバス内座標（css px）。 */
  function localPos(p) {
    return { x: cssW + MARGIN - p.x * (cssW + MARGIN * 2), y: cssH * 0.55 };
  }

  function drawRoad(now) {
    const g = ctx.createLinearGradient(0, 0, 0, cssH);
    g.addColorStop(0, '#1d1830');
    g.addColorStop(1, '#2a2340');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);
    // 歩道と車道
    ctx.fillStyle = '#3a3150';
    ctx.fillRect(0, cssH * 0.72, cssW, cssH * 0.28);
    ctx.strokeStyle = 'rgba(241,236,250,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 12]);
    ctx.lineDashOffset = -((now / 40) % 26);
    ctx.beginPath();
    ctx.moveTo(0, cssH * 0.86);
    ctx.lineTo(cssW, cssH * 0.86);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPerson(job, name, x, y, alpha, bob) {
    ctx.globalAlpha = alpha;
    ctx.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(JOBS[job] ? JOBS[job].icon : '?', x, y + bob);
    if (name) {
      ctx.font = '11px "Noto Sans JP",system-ui,sans-serif';
      ctx.fillStyle = 'rgba(241,236,250,0.85)';
      ctx.fillText(name, x, y + 26);
    }
    ctx.globalAlpha = 1;
  }

  return {
    render(state, now) {
      if (!resize()) return;
      drawRoad(now);
      ctx.fillStyle = '#f1ecfa';
      for (const p of state.street) {
        const pos = localPos(p);
        const bob = Math.sin(now / 160 + p.x * 40) * 2;
        drawPerson(p.job, p.name, pos.x, pos.y, 1, bob);
      }
      for (let i = ghosts.length - 1; i >= 0; i--) {
        const gh = ghosts[i];
        const t = (now - gh.start) / FADE_MS;
        if (t >= 1) { ghosts.splice(i, 1); continue; }
        // 下（待機枠の方向）へ吸い込まれながら薄くなる
        ctx.fillStyle = '#f1ecfa';
        drawPerson(gh.job, '', gh.px, gh.py + t * cssH * 0.5, 1 - t, 0);
      }
    },

    hitTest(clientX, clientY, state) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return null;
      cssW = rect.width;
      cssH = rect.height;
      const lx = clientX - rect.left;
      const ly = clientY - rect.top;
      let best = null;
      let bestD = HIT_RADIUS;
      for (const p of state.street) {
        const pos = localPos(p);
        const d = Math.hypot(pos.x - lx, pos.y - ly);
        if (d <= bestD) { best = p.id; bestD = d; }
      }
      return best;
    },

    /** 人物の画面座標（clientX/Y）。テスト・デバッグ用。 */
    screenPoint(person) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return null;
      cssW = rect.width;
      cssH = rect.height;
      const pos = localPos(person);
      return { x: rect.left + pos.x, y: rect.top + pos.y };
    },

    fadeOut(person, now) {
      const pos = localPos(person);
      ghosts.push({ job: person.job, px: pos.x, py: pos.y, start: now });
    },
  };
}
