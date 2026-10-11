import React from 'react';

interface VirtualKeyboardProps {
  nextKey: string;
  /** 超ハードなど答えを伏せるモード */
  hidden?: boolean;
}

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

/** 次に押すキーを光らせる打鍵アシスト（プレイ画面に収まるよう小さめ） */
export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ nextKey, hidden = false }) => {
  const target = hidden ? '' : nextKey.toUpperCase();
  return (
    <div className="flex flex-col items-center gap-1 font-mono-code font-bold select-none text-[11px]" aria-hidden="true">
      {ROWS.map((row, r) => (
        <div key={row} className="flex gap-1" style={{ marginLeft: r * 14 }}>
          {[...row].map((k) => {
            const active = k === target;
            return (
              <div
                key={k}
                className={`w-7 h-7 rounded flex items-center justify-center border transition-all duration-75 ${
                  active ? 'bg-[#ffe100] text-[#0e0e0e] border-[#ffe100] shadow-[0_0_10px_#ffe100] scale-110' : 'bg-[#2a2a2a] text-[#cec6aa] border-[#353534]'
                }`}
              >
                {k}
              </div>
            );
          })}
        </div>
      ))}
      <div className="text-[10px] text-[#cec6aa] mt-0.5">
        NEXT KEY：<span className="text-[#ffe100]">{hidden ? '?' : target || '-'}</span>
      </div>
    </div>
  );
};
