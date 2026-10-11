/* 二郎系店主 アニメーション・表情SVGジェネレーター */
const Master = (() => {
  function render(mood = 'normal') {
    // 表情パラメータ
    // normal: 「ニンニク入れますか？」真剣な職人の眼光、問いかけ
    // success: 「あいよ！」満面の笑み、満足げな表情
    // stern: 「ロットが乱れました…」腕組み、怒り・呆れの引きつり、湯気
    // wait: 「食券を拝見します」落ち着いた眼差し

    const isSuccess = mood === 'success';
    const isStern = mood === 'stern';
    const isWait = mood === 'wait';

    // 眉毛
    let browLeft = 'M 54 62 Q 66 60 76 65';
    let browRight = 'M 88 65 Q 98 60 110 62';
    if (isStern) {
      browLeft = 'M 54 67 Q 66 65 77 60';
      browRight = 'M 87 60 Q 98 65 110 67';
    } else if (isSuccess) {
      browLeft = 'M 54 60 Q 66 56 76 60';
      browRight = 'M 88 60 Q 98 56 110 60';
    }

    // 目
    let eyes = '';
    if (isSuccess) {
      // 笑顔の三日月目
      eyes = `
        <path d="M 56 73 Q 66 65 76 73" fill="none" stroke="#1f1610" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 88 73 Q 98 65 108 73" fill="none" stroke="#1f1610" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 52 79 Q 60 84 68 80" fill="none" stroke="#e07a5f" stroke-width="2.5" opacity="0.6"/>
        <path d="M 96 80 Q 104 84 112 79" fill="none" stroke="#e07a5f" stroke-width="2.5" opacity="0.6"/>
      `;
    } else if (isStern) {
      // 鋭い怒りの目（白目＋小さな黒目）
      eyes = `
        <ellipse cx="66" cy="72" rx="9" ry="7" fill="#fff" stroke="#1f1610" stroke-width="2"/>
        <circle cx="67" cy="71" r="3.5" fill="#1f1610"/>
        <ellipse cx="98" cy="72" rx="9" ry="7" fill="#fff" stroke="#1f1610" stroke-width="2"/>
        <circle cx="97" cy="71" r="3.5" fill="#1f1610"/>
        <path d="M 58 67 L 74 69" stroke="#1f1610" stroke-width="2.5"/>
        <path d="M 90 69 L 106 67" stroke="#1f1610" stroke-width="2.5"/>
        <path d="M 78 68 L 86 68" stroke="#8b261e" stroke-width="2" stroke-linecap="round"/>
        <path d="M 80 64 L 84 72" stroke="#8b261e" stroke-width="1.8"/>
      `;
    } else {
      // 通常：ギラリと光る職人の眼光
      eyes = `
        <ellipse cx="66" cy="72" rx="10" ry="7.5" fill="#fff" stroke="#1f1610" stroke-width="2.2"/>
        <circle cx="67" cy="72" r="4.8" fill="#1f1610"/>
        <circle cx="69" cy="70" r="1.6" fill="#fff"/>
        <ellipse cx="98" cy="72" rx="10" ry="7.5" fill="#fff" stroke="#1f1610" stroke-width="2.2"/>
        <circle cx="97" cy="72" r="4.8" fill="#1f1610"/>
        <circle cx="99" cy="70" r="1.6" fill="#fff"/>
        <path d="M 58 68 Q 66 66 74 69" stroke="#1f1610" stroke-width="2.5" fill="none"/>
        <path d="M 90 69 Q 98 66 106 68" stroke="#1f1610" stroke-width="2.5" fill="none"/>
      `;
    }

    // 口
    let mouth = '';
    if (isSuccess) {
      // 白い歯が見える豪快な笑み
      mouth = `
        <path d="M 68 95 Q 82 112 96 95 Z" fill="#7a1c14" stroke="#1f1610" stroke-width="2"/>
        <path d="M 72 95 Q 82 101 92 95" fill="#fff" stroke="#1f1610" stroke-width="1.5"/>
      `;
    } else if (isStern) {
      // への字口、引き結んだ口
      mouth = `
        <path d="M 70 102 Q 82 96 94 102" fill="none" stroke="#1f1610" stroke-width="3.5" stroke-linecap="round"/>
      `;
    } else {
      // 問いかけ（「ニンニク入れますか？」）半開き
      mouth = `
        <path d="M 71 96 Q 82 93 93 96 Q 82 104 71 96 Z" fill="#691a13" stroke="#1f1610" stroke-width="2"/>
        <path d="M 75 96 Q 82 99 89 96" fill="#fff"/>
      `;
    }

    // 怒りのマーク（ロット乱れ時）
    const angerMark = isStern ? `
      <g transform="translate(112, 42)">
        <path d="M-6 -6 L6 6 M-6 6 L6 -6" stroke="#c0282d" stroke-width="3" stroke-linecap="round"/>
        <path d="M-10 0 Q-10 -10 0 -10 Q10 -10 10 0 Q10 10 0 10 Q-10 10 -10 0" fill="none" stroke="#c0282d" stroke-width="2.5"/>
      </g>
    ` : '';

    // 汗・キラリ
    const effect = isSuccess ? `
      <g transform="translate(110, 48)">
        <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#ffd100"/>
      </g>
    ` : '';

    return `
      <svg class="master-svg mood-${mood}" viewBox="0 0 164 164" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="masterSkin" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="#fedbb5"/>
            <stop offset="70%" stop-color="#f0bd8d"/>
            <stop offset="100%" stop-color="#dfa272"/>
          </radialGradient>
          <linearGradient id="masterTowel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#edeae3"/>
            <stop offset="100%" stop-color="#d6d1c5"/>
          </linearGradient>
          <linearGradient id="masterShirt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#242220"/>
            <stop offset="100%" stop-color="#110f0e"/>
          </linearGradient>
          <filter id="masterShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>

        <!-- 背景の厨房スチーム光輪 -->
        <circle cx="82" cy="82" r="76" fill="#2d1a10" stroke="#ffd100" stroke-width="3" filter="url(#masterShadow)"/>
        <circle cx="82" cy="82" r="72" fill="#3a2216" opacity="0.6"/>

        <g id="masterBody">
          <!-- 肩・黒Tシャツ -->
          <path d="M 18 164 C 22 134 44 122 64 120 L 100 120 C 120 122 142 134 146 164 Z" fill="url(#masterShirt)"/>
          <!-- Tシャツ首元 -->
          <path d="M 64 120 Q 82 134 100 120 Z" fill="#151312"/>
          <!-- 胸元の黄色い文字（「郎」または「二」） -->
          <text x="82" y="148" font-family="'Dela Gothic One', sans-serif" font-size="16" fill="#ffe100" text-anchor="middle" font-weight="bold">郎</text>

          <!-- 首 -->
          <path d="M 66 102 L 66 124 Q 82 130 98 124 L 98 102 Z" fill="#e2a879"/>
          <!-- 首の筋肉影 -->
          <path d="M 75 106 Q 82 120 89 106" fill="none" stroke="#cb8b58" stroke-width="2"/>

          <!-- 耳 -->
          <ellipse cx="44" cy="80" rx="7" ry="11" fill="url(#masterSkin)" stroke="#1f1610" stroke-width="2"/>
          <path d="M 44 76 Q 47 80 44 85" fill="none" stroke="#cb8b58" stroke-width="1.8"/>
          <ellipse cx="120" cy="80" rx="7" ry="11" fill="url(#masterSkin)" stroke="#1f1610" stroke-width="2"/>
          <path d="M 120 76 Q 117 80 120 85" fill="none" stroke="#cb8b58" stroke-width="1.8"/>

          <!-- 顔輪郭（力強いエラ） -->
          <path d="M 48 64 C 48 94 56 114 82 116 C 108 114 116 94 116 64 C 116 46 104 42 82 42 C 60 42 48 46 48 64 Z" fill="url(#masterSkin)" stroke="#1f1610" stroke-width="2.5"/>

          <!-- 髭（うっすらとした青髭・無骨さ） -->
          <path d="M 64 96 Q 82 114 100 96 C 96 112 68 112 64 96 Z" fill="#b98a67" opacity="0.45"/>

          <!-- 鼻 -->
          <path d="M 82 68 L 80 84 Q 82 86 86 84" fill="none" stroke="#2a160c" stroke-width="2.5" stroke-linecap="round"/>
          <ellipse cx="76" cy="84" rx="2" ry="1.5" fill="#a46842"/>
          <ellipse cx="88" cy="84" rx="2" ry="1.5" fill="#a46842"/>

          <!-- 眉毛 -->
          <path d="${browLeft}" fill="none" stroke="#1f1610" stroke-width="5" stroke-linecap="round"/>
          <path d="${browRight}" fill="none" stroke="#1f1610" stroke-width="5" stroke-linecap="round"/>

          <!-- 目 -->
          ${eyes}

          <!-- 口 -->
          ${mouth}

          <!-- 鉢巻（白タオルねじり鉢巻） -->
          <g id="masterHachimaki">
            <!-- 鉢巻の帯 -->
            <path d="M 44 54 C 54 45 110 45 120 54 L 122 42 C 110 32 54 32 42 42 Z" fill="url(#masterTowel)" stroke="#221811" stroke-width="2.2"/>
            <!-- ねじりの皺 -->
            <path d="M 52 48 Q 58 43 64 50" fill="none" stroke="#b0a99c" stroke-width="2"/>
            <path d="M 72 47 Q 78 42 84 49" fill="none" stroke="#b0a99c" stroke-width="2"/>
            <path d="M 92 47 Q 98 42 104 49" fill="none" stroke="#b0a99c" stroke-width="2"/>
            <path d="M 110 49 Q 115 44 119 51" fill="none" stroke="#b0a99c" stroke-width="2"/>
            <!-- 結び目（左側） -->
            <path d="M 38 46 Q 32 50 36 56 Q 42 54 42 48 Z" fill="url(#masterTowel)" stroke="#221811" stroke-width="2"/>
            <path d="M 33 53 Q 28 62 33 68 Q 38 65 37 56 Z" fill="url(#masterTowel)" stroke="#221811" stroke-width="2"/>
          </g>

          <!-- 前髪ちょい見え -->
          <path d="M 60 52 Q 64 56 68 53" fill="none" stroke="#1f1610" stroke-width="3" stroke-linecap="round"/>
          <path d="M 96 52 Q 100 56 104 53" fill="none" stroke="#1f1610" stroke-width="3" stroke-linecap="round"/>
        </g>

        ${angerMark}
        ${effect}
      </svg>
    `;
  }

  return { render };
})();
