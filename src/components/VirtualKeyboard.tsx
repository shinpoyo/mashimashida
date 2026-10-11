import React from 'react';

interface VirtualKeyboardProps {
  nextKey: string;
  /** 超ハードなど答えを伏せるモード */
  hidden?: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ nextKey, hidden = false }) => {
  const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SPACE'];

  const target = hidden ? '' : nextKey.toUpperCase();

  const isKeyActive = (key: string) => {
    if (key === 'SPACE' && target === ' ') return true;
    return key === target;
  };

  return (
    <div className="bg-[#1c1b1b] border-2 border-[#353534] rounded-xl p-4 shadow-hard-sm">
      <div className="flex items-center justify-between pb-3 text-xs">
        <span className="flex items-center gap-1.5 text-[#cec6aa] font-bold">
          <span className="material-symbols-outlined text-sm text-[#ffe100]">keyboard</span>
          リアルタイム打鍵アシスト・キーボード
        </span>
        <span className="font-mono-code font-bold text-xs tracking-wider">
          NEXT KEY: <span className="text-[#ffe100] bg-[#353534] px-2 py-0.5 rounded border border-[#ffe100]">[ {hidden ? '?' : target === ' ' ? 'SPACE' : target || '-'} ]</span>
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5 font-mono-code font-bold select-none text-xs">
        {/* Row 1 */}
        <div className="flex gap-1.5 w-full justify-center">
          {row1.map((k) => {
            const active = isKeyActive(k);
            return (
              <div
                key={k}
                className={`w-7 sm:w-8 h-8 rounded flex items-center justify-center border transition-all duration-75 ${
                  active
                    ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100] shadow-[0_0_12px_#ffe100] scale-110 font-black'
                    : 'bg-[#2a2a2a] text-[#cec6aa] border-[#353534]'
                }`}
              >
                {k}
              </div>
            );
          })}
        </div>

        {/* Row 2 */}
        <div className="flex gap-1.5 w-full justify-center">
          {row2.map((k) => {
            const active = isKeyActive(k);
            return (
              <div
                key={k}
                className={`w-7 sm:w-8 h-8 rounded flex items-center justify-center border transition-all duration-75 ${
                  active
                    ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100] shadow-[0_0_12px_#ffe100] scale-110 font-black'
                    : 'bg-[#2a2a2a] text-[#cec6aa] border-[#353534]'
                }`}
              >
                {k}
              </div>
            );
          })}
        </div>

        {/* Row 3 */}
        <div className="flex gap-1.5 w-full justify-center">
          {row3.map((k) => {
            const active = isKeyActive(k);
            const isSpace = k === 'SPACE';
            return (
              <div
                key={k}
                className={`h-8 rounded flex items-center justify-center border transition-all duration-75 ${
                  isSpace ? 'w-20 sm:w-28 text-[10px]' : 'w-7 sm:w-8'
                } ${
                  active
                    ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100] shadow-[0_0_12px_#ffe100] scale-110 font-black'
                    : 'bg-[#2a2a2a] text-[#cec6aa] border-[#353534]'
                }`}
              >
                {k}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
