/* ユーザー提供の写真「二郎系ラーメン実物」を忠実に再現した高精度SVG描画エンジン
 * 特徴の完全一致：
 * 1. 白磁丼＋縁の鮮やかな青い雷文（稲妻模様）＆内外の青い二重線＆胴体の青い2本ストライプ
 * 2. 手前右にドンと盛られた「極厚バラロール神豚（2枚）」：美しい脂身スパイラル・タレ皮目・割れ目
 * 3. 手前左に盛られた「刻み生ニンニク」：黄色がかった角切り生粒の山
 * 4. 左側のスープから顔を出す「自家製極太ワシワシ平打ち麺」
 * 5. 中央にそびえる「モヤシ＆キャベツの円錐ピラミッド」
 * 6. 頂上に盛られた「特製味付け背脂（茶褐色の塊アブラ）」
 * 7. スープ表面一面に漂う「チャッチャ細背脂」の油膜と立ち上る白い湯気
 */
const Bowl = (() => {
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  // カラメ（醤油ダレ濃度）に応じたスープの色調（写真基準）
  const SOUP_COLORS = [
    { base: '#dca45d', mid: '#b36c2e', deep: '#7e3e11', fat: '#fff7ed' }, // 0: 薄め
    { base: '#cb8b45', mid: '#9e561e', deep: '#692d08', fat: '#ffedd5' }, // 1: そのまま（写真基準）
    { base: '#b77631', mid: '#8a4413', deep: '#592105', fat: '#fed7aa' }, // 2: カラメ少々
    { base: '#a46322', mid: '#76340a', deep: '#4b1803', fat: '#fdba74' }, // 3: カラメ
    { base: '#8e4f16', mid: '#622705', deep: '#3d1201', fat: '#fb923c' }, // 4: カラママシ
    { base: '#793d0d', mid: '#501c03', deep: '#300b00', fat: '#f97316' }, // 5: ×3
    { base: '#642d07', mid: '#3f1301', deep: '#240700', fat: '#ea580c' }, // 6: ×4
    { base: '#512004', mid: '#300c00', deep: '#1a0400', fat: '#c2410c' }, // 7: ×5
    { base: '#3d1502', mid: '#220700', deep: '#120200', fat: '#9a3412' }, // 8: 限界
  ];

  function render(lv, seed = 1) {
    const r = rng(seed);
    const cx = 150, top = 168;

    // ヤサイの高さと広がり（写真通りの美しい円錐型）
    // 十分なヘッドルームを確保（viewBox: 0 -115 300 375）
    const H_LIST = [0, 24, 42, 62, 84, 105, 126, 146, 168, 195];
    const W_LIST = [0, 40, 56, 68, 80, 90, 98, 104, 110, 116];
    const ylv = Math.min(lv.yasai, H_LIST.length - 1);
    const H = H_LIST[ylv];
    const W = W_LIST[ylv];
    const peak = top - H;

    const klv = Math.min(lv.karame, SOUP_COLORS.length - 1);
    const soup = SOUP_COLORS[klv];

    const uid = 'ramen' + Math.floor(r() * 100000);

    let defs = `
      <defs>
        <!-- 丼白磁の立体陰影グラデーション -->
        <linearGradient id="${uid}-bowlPorcelain" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#b0bccd"/>
          <stop offset="14%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#f8fafc"/>
          <stop offset="86%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#a8b5c7"/>
        </linearGradient>
        <!-- スープの乳化豚骨醤油グラデーション -->
        <radialGradient id="${uid}-soupEmulsion" cx="46%" cy="32%" r="68%">
          <stop offset="0%" stop-color="${soup.base}"/>
          <stop offset="50%" stop-color="${soup.mid}"/>
          <stop offset="90%" stop-color="${soup.deep}"/>
          <stop offset="100%" stop-color="#1f0902"/>
        </radialGradient>
        <!-- バラロール豚の肉質グラデーション -->
        <linearGradient id="${uid}-porkMeat" x1="0%" y1="0%" x2="100%" y2="85%">
          <stop offset="0%" stop-color="#c98251"/>
          <stop offset="35%" stop-color="#a45b2c"/>
          <stop offset="70%" stop-color="#7a3a16"/>
          <stop offset="100%" stop-color="#4d200a"/>
        </linearGradient>
        <!-- 頂上の味付け背脂（茶褐色・醤油煮込み） -->
        <radialGradient id="${uid}-aburaSoy" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fff8e7"/>
          <stop offset="30%" stop-color="#eab574"/>
          <stop offset="70%" stop-color="#ad6924"/>
          <stop offset="100%" stop-color="#65350c"/>
        </radialGradient>
        <!-- 刻みニンニクの生粒グラデーション -->
        <radialGradient id="${uid}-garlic" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="60%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#eab308"/>
        </radialGradient>
        <!-- 写真の青い雷文（ラーメンマーク・帯パターン） -->
        <pattern id="${uid}-raimon" width="22" height="12" patternUnits="userSpaceOnUse">
          <path d="M 2 2 H 20 V 10 H 6 V 5 H 15 V 7 H 10" fill="none" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="square"/>
        </pattern>
        <!-- 影用フィルター -->
        <filter id="${uid}-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
        <filter id="${uid}-blur">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
        <filter id="${uid}-steamBlur">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>
    `;

    let g = defs;

    // 1. 赤カウンターへの接地影＆丼本体（写真通りの白磁・青二重線・青雷文・胴体の2本青ストライプ）
    g += `
      <!-- 赤カウンターに落ちる丼の丸影 -->
      <ellipse cx="${cx}" cy="${top + 104}" rx="82" ry="16" fill="rgba(60,10,10,0.55)" filter="url(#${uid}-blur)"/>

      <!-- 丼の胴体（高口切立深型丼） -->
      <path d="M 22 ${top} C 26 270 82 284 150 286 C 218 284 274 270 278 ${top} Z" fill="url(#${uid}-bowlPorcelain)" stroke="#0f172a" stroke-width="2.6" filter="url(#${uid}-shadow)"/>

      <!-- 丼の底の高台（こうだい） -->
      <path d="M 90 284 L 94 298 Q 150 302 206 298 L 210 284 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"/>
      <ellipse cx="${cx}" cy="296" rx="55" ry="4.5" fill="#cbd5e1"/>
      <ellipse cx="${cx}" cy="298" rx="54" ry="3.5" fill="none" stroke="#2563eb" stroke-width="1.2"/>

      <!-- 写真の特徴：丼の胴体に走る2本の青い平行ストライプ -->
      <path d="M 42 216 Q 150 242 258 216" fill="none" stroke="#2563eb" stroke-width="2.8"/>
      <path d="M 50 232 Q 150 256 250 232" fill="none" stroke="#2563eb" stroke-width="2"/>

      <!-- 丼の縁（リム）：白磁＋鮮やかな青の二重線＆青い雷文帯 -->
      <ellipse cx="${cx}" cy="${top}" rx="128" ry="28" fill="#ffffff" stroke="#1e3a8a" stroke-width="3"/>
      <!-- 外側青ライン -->
      <ellipse cx="${cx}" cy="${top}" rx="122" ry="26.5" fill="none" stroke="#2563eb" stroke-width="1.6"/>
      <!-- 青い雷文模様の帯 -->
      <ellipse cx="${cx}" cy="${top}" rx="118" ry="25" fill="url(#${uid}-raimon)" stroke="#1d4ed8" stroke-width="1.2"/>
      <!-- 内側青ライン -->
      <ellipse cx="${cx}" cy="${top}" rx="111" ry="22.5" fill="#f8fafc" stroke="#1d4ed8" stroke-width="1.8"/>

      <!-- スープ表面（微乳化〜乳化 豚骨醤油） -->
      <ellipse cx="${cx}" cy="${top + 3}" rx="108" ry="20" fill="url(#${uid}-soupEmulsion)"/>
    `;

    // 2. スープ表面一面にびっしり浮遊する「チャッチャ細背脂」と液状豚脂（写真の最大の特徴！）
    const fatDropsCount = 54 + Math.min(lv.abura * 6, 60);
    for (let i = 0; i < fatDropsCount; i++) {
      const angle = r() * Math.PI * 2;
      const dist = 14 + r() * 88;
      const fx = cx + Math.cos(angle) * dist;
      const fy = (top + 4) + Math.sin(angle) * (dist * 0.17);
      const frx = 1.8 + r() * 3.2;
      const fry = 1.0 + r() * 1.8;
      g += `
        <ellipse cx="${fx}" cy="${fy}" rx="${frx}" ry="${fry}" fill="${soup.fat}" opacity="${0.68 + r() * 0.32}"/>
        <ellipse cx="${fx - frx * 0.3}" cy="${fy - fry * 0.3}" rx="${frx * 0.35}" ry="${fry * 0.35}" fill="#ffffff" opacity="0.8"/>
      `;
    }

    // 3. 極太ワシワシ平打ち麺（写真通り、左側から力強くスープから覗く！）
    g += `<g stroke-linecap="round" fill="none">`;
    const noodles = [
      { d: `M 46 ${top + 3} Q 58 ${top - 8} 74 ${top + 2} T 96 ${top + 5}` },
      { d: `M 40 ${top + 9} Q 54 ${top} 68 ${top + 10} T 90 ${top + 7}` },
      { d: `M 52 ${top + 15} Q 66 ${top + 5} 82 ${top + 14} T 104 ${top + 9}` },
      { d: `M 60 ${top + 1} Q 72 ${top - 10} 88 ${top} T 110 ${top + 4}` },
      { d: `M 38 ${top + 14} Q 48 ${top + 7} 60 ${top + 16}` },
    ];
    noodles.forEach((nd) => {
      // 褐色の醤油ダレを吸った極太平打ち縮れ麺（オーション麺）
      g += `
        <path d="${nd.d}" stroke="#8c4e16" stroke-width="5.8"/>
        <path d="${nd.d}" stroke="#d69335" stroke-width="4.2"/>
        <path d="${nd.d}" stroke="#fed672" stroke-width="2.4" opacity="0.92"/>
      `;
    });
    g += `</g>`;

    // 4. ヤサイの山（モヤシ＆キャベツ）：写真通りの端正な美しい円錐ピラミッド
    if (H > 0) {
      g += `
        <defs>
          <linearGradient id="${uid}-mountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="45%" stop-color="#f8fafc"/>
            <stop offset="80%" stop-color="#f1f5f9"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>
        </defs>
        <!-- 山のボリューム陰影 -->
        <path d="M ${cx - W} ${top + 5} Q ${cx - W * 0.65} ${peak + H * 0.18} ${cx} ${peak} Q ${cx + W * 0.65} ${peak + H * 0.18} ${cx + W} ${top + 5} Z" fill="rgba(30,20,10,0.25)" transform="translate(0, 4)"/>
        <!-- ヤサイの美しい円錐フォルム -->
        <path d="M ${cx - W} ${top + 5} Q ${cx - W * 0.65} ${peak + H * 0.18} ${cx} ${peak} Q ${cx + W * 0.65} ${peak + H * 0.18} ${cx + W} ${top + 5} Z" fill="url(#${uid}-mountain)" stroke="#94a3b8" stroke-width="1.6"/>
      `;

      // キャベツ（写真の特徴：所々に混ざる鮮やかな黄緑色の甘いキャベツ）
      const cab = 5 + ylv * 4;
      for (let i = 0; i < cab; i++) {
        const t = r();
        const y = peak + 7 + r() * Math.max(H - 14, 8);
        const half = W * ((y - peak) / H) * 0.82;
        const x = cx - half + t * half * 2;
        const cRot = (r() - 0.5) * 60;
        const cw = 13 + r() * 11;
        const ch = 9 + r() * 8;
        g += `
          <g transform="translate(${x}, ${y}) rotate(${cRot})">
            <!-- キャベツの鮮やかな葉 -->
            <path d="M 0 0 C ${cw * 0.3} ${-ch * 0.7} ${cw * 0.8} ${-ch * 0.5} ${cw} 0 C ${cw * 0.7} ${ch * 0.7} ${cw * 0.3} ${ch * 0.5} 0 0 Z" fill="#86efac" stroke="#4ade80" stroke-width="1.3" opacity="0.95"/>
            <!-- 葉脈の白筋 -->
            <path d="M 0 0 Q ${cw * 0.5} 0 ${cw} 0" stroke="#dcfce7" stroke-width="1.5" fill="none"/>
          </g>
        `;
      }

      // モヤシ（写真通りの長くてしなやかな白い茎＋頭の黄色い豆）
      const moy = 20 + ylv * 16;
      for (let i = 0; i < moy; i++) {
        const y = peak + 4 + r() * Math.max(H - 4, 6);
        const half = W * ((y - peak) / H) * 0.94;
        const x = cx - half + r() * half * 2;
        const rot = (r() - 0.5) * 88;
        const len = 15 + r() * 10;
        g += `
          <g transform="translate(${x}, ${y}) rotate(${rot})">
            <!-- モヤシのシャキシャキした白い茎 -->
            <path d="M 0 0 Q ${len * 0.4} ${r() * 4 - 2} ${len} 0" stroke="#f8fafc" stroke-width="3.4" stroke-linecap="round" fill="none"/>
            <path d="M 0 0 Q ${len * 0.4} ${r() * 4 - 2} ${len} 0" stroke="#e2e8f0" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.7"/>
            <!-- 頭の黄色い豆頭 -->
            <ellipse cx="${len + 1}" cy="0" rx="2.8" ry="2.0" fill="#fde047" stroke="#ca8a04" stroke-width="0.9"/>
          </g>
        `;
      }
    }

    // 5. 手前右の「極厚バラロール神豚 2枚」（写真で最も目を引く主役！）
    // 奥のブタ（2枚目）
    g += `
      <g transform="translate(210, ${top - 6}) rotate(28)">
        <ellipse cx="0" cy="0" rx="34" ry="23" fill="url(#${uid}-porkMeat)" stroke="#3f1906" stroke-width="2.8"/>
        <!-- 脂身の層 -->
        <path d="M -22 -5 Q 0 -16 22 -7 Q 0 5 -22 -5 Z" fill="#fef3c7" opacity="0.96"/>
        <line x1="-15" y1="-10" x2="8" y2="-12" stroke="#2c1103" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    `;
    // 手前のブタ（1枚目・写真通りの分厚い断面と中央のほぐれる割れ目）
    g += `
      <g transform="translate(182, ${top + 10}) rotate(11)">
        <!-- 豚のドッシリとした影 -->
        <ellipse cx="0" cy="3" rx="38" ry="29" fill="rgba(30,10,0,0.45)" filter="url(#${uid}-blur)"/>
        <!-- 赤身＆タレの染みたジューシーな肉質断面 -->
        <ellipse cx="0" cy="0" rx="37" ry="28" fill="url(#${uid}-porkMeat)" stroke="#3e1a07" stroke-width="3"/>
        <!-- 写真の再現：外側の醤油ダレが染み込んだ濃い茶色の皮目 -->
        <path d="M -36 2 C -36 -22 36 -22 36 2" stroke="#250d02" stroke-width="5.5" fill="none"/>
        <!-- 写真の再現：ぐるりと巻かれたジューシーな白い脂身の美しいスパイラル層 -->
        <path d="M -28 -4 C -22 -18 22 -17 28 -3 C 24 7 -5 12 -25 3 C -19 -5 7 -7 15 0" stroke="#fef9ee" stroke-width="6.2" stroke-linecap="round" fill="none"/>
        <path d="M -20 7 Q 0 14 20 7" stroke="#fef9ee" stroke-width="3.8" fill="none" opacity="0.9"/>
        <!-- 写真の再現：中央のホロホロにほどける肉の割れ目スリット -->
        <path d="M -8 5 Q 0 14 8 7" stroke="#3b1605" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <!-- 焼き目とタレの照りハイライト -->
        <ellipse cx="-10" cy="-6" rx="4" ry="2" fill="#ffffff" opacity="0.8"/>
        <ellipse cx="10" cy="-4" rx="5" ry="2.2" fill="#ffffff" opacity="0.8"/>
      </g>
    `;

    // 6. 手前左の「刻み生ニンニク」（写真通り、スープと麺のすぐそばにガツンとこんもり）
    const NN_COUNT = [0, 8, 18, 30, 44, 60, 78, 98, 120];
    const nlv = Math.min(lv.ninniku, NN_COUNT.length - 1);
    const nn = NN_COUNT[nlv];
    if (nn > 0) {
      const gBaseX = 106;
      const gBaseY = top + 22;
      g += `
        <!-- ニンニク山の下地影 -->
        <ellipse cx="${gBaseX}" cy="${gBaseY + 4}" rx="${Math.sqrt(nn) * 3.2 + 7}" ry="${Math.sqrt(nn) * 2.0 + 5}" fill="rgba(50,20,5,0.45)" filter="url(#${uid}-blur)"/>
      `;
      for (let i = 0; i < nn; i++) {
        const ring = Math.sqrt(i) * 3.0;
        const ang = i * 2.38;
        const gx = gBaseX + Math.cos(ang) * ring * 1.5 + (r() - 0.5) * 2.2;
        const gy = gBaseY - Math.sin(ang) * ring * 0.7 - (nn - i) * 0.16 + (r() - 0.5) * 2.2;
        const gw = 4.4 + r() * 3.0;
        const gh = 3.4 + r() * 2.5;
        const gRot = (r() - 0.5) * 55;
        g += `
          <g transform="translate(${gx}, ${gy}) rotate(${gRot})">
            <!-- 写真の再現：角切り生ニンニクのリアルな粒感 -->
            <polygon points="0,0 ${gw},0.9 ${gw * 0.85},${gh} 0.5,${gh * 0.9}" fill="url(#${uid}-garlic)" stroke="#ca8a04" stroke-width="0.8"/>
            <circle cx="${gw * 0.3}" cy="${gh * 0.3}" r="1.0" fill="#ffffff" opacity="0.95"/>
          </g>
        `;
      }
    }

    // 7. 頂上の「特製味付け背脂」（写真通り、野菜の頂点に盛られた茶褐色の塊アブラ！）
    const AB_COUNT = [0, 4, 8, 14, 20, 28, 38, 50, 65];
    const alv = Math.min(lv.abura, AB_COUNT.length - 1);
    const ab = AB_COUNT[alv];
    if (ab > 0 && H > 0) {
      const aPeakX = cx;
      const aPeakY = peak + 4;
      g += `
        <!-- 頂上背脂の下地影 -->
        <ellipse cx="${aPeakX}" cy="${aPeakY + 3}" rx="${Math.sqrt(ab) * 3.4 + 6}" ry="${Math.sqrt(ab) * 2.0 + 4}" fill="rgba(60,20,5,0.45)" filter="url(#${uid}-blur)"/>
      `;
      for (let i = 0; i < ab; i++) {
        const rad = Math.sqrt(i) * 3.0;
        const aAng = i * 2.4;
        const ax = aPeakX + Math.cos(aAng) * rad * 1.4 + (r() - 0.5) * 2.2;
        const ay = aPeakY + Math.sin(aAng) * rad * 0.8 - (ab - i) * 0.22 + (r() - 0.5) * 2.2;
        const asize = 6.5 + r() * 5.2;
        g += `
          <!-- 写真の再現：醤油ダレで煮込まれたアンバー色・茶色のトロトロ塊アブラ -->
          <circle cx="${ax}" cy="${ay + 1}" r="${asize * 0.9}" fill="rgba(40,15,5,0.35)"/>
          <path d="M ${ax - asize * 0.8} ${ay} Q ${ax} ${ay - asize * 0.9} ${ax + asize * 0.8} ${ay} Q ${ax + asize * 0.9} ${ay + asize * 0.7} ${ax} ${ay + asize * 0.8} Q ${ax - asize * 0.9} ${ay + asize * 0.7} ${ax - asize * 0.8} ${ay} Z" fill="url(#${uid}-aburaSoy)" stroke="#78350f" stroke-width="1.0"/>
          <!-- 煮込み背脂のプルプルツヤハイライト -->
          <ellipse cx="${ax - asize * 0.25}" cy="${ay - asize * 0.25}" rx="${asize * 0.38}" ry="${asize * 0.24}" fill="#ffffff" opacity="0.9"/>
        `;
      }
    }

    // 8. カエシ・醤油ダレ（カラメ）：野菜の斜面を伝う濃厚ダレ
    const STREAKS_COUNT = [0, 0, 1, 2, 3, 4, 5, 6, 8];
    const streaks = STREAKS_COUNT[klv];
    for (let i = 0; i < streaks; i++) {
      const span = Math.min(W * 0.75, 70);
      const sx = cx - span / 2 + (streaks === 1 ? span / 2 : (span / (streaks - 1)) * i);
      const sy = (H > 0 ? peak + 4 : top - 6) + 3;
      const len = Math.max(H * 0.65, 16);
      const dir = sx < cx ? -1 : 1;
      g += `
        <path d="M ${sx} ${sy} Q ${sx + dir * 10} ${sy + len * 0.5} ${sx + dir * 5} ${sy + len}" stroke="#351203" stroke-width="4.8" stroke-linecap="round" fill="none" opacity="0.95"/>
        <path d="M ${sx} ${sy} Q ${sx + dir * 10} ${sy + len * 0.5} ${sx + dir * 5} ${sy + len}" stroke="#fde68a" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.6"/>
      `;
    }

    // 9. 立ち上る湯気（写真のモクモクとした出来立ての湯気を再現）
    g += `
      <g class="bowl-steam">
        <path d="M ${cx - 28} ${peak - 6} Q ${cx - 48} ${peak - 55} ${cx - 22} ${peak - 100} T ${cx - 36} ${peak - 160}" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.5" filter="url(#${uid}-steamBlur)"/>
        <path d="M ${cx + 5} ${peak - 10} Q ${cx + 25} ${peak - 60} ${cx - 8} ${peak - 110} T ${cx + 12} ${peak - 170}" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.6" filter="url(#${uid}-steamBlur)"/>
        <path d="M ${cx + 38} ${peak - 4} Q ${cx + 22} ${peak - 50} ${cx + 46} ${peak - 95} T ${cx + 28} ${peak - 150}" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" opacity="0.45" filter="url(#${uid}-steamBlur)"/>
      </g>
    `;

    return `<svg viewBox="0 -115 300 425" xmlns="http://www.w3.org/2000/svg" class="bowl">${g}</svg>`;
  }

  return { render };
})();
