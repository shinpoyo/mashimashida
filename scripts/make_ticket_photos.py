#!/usr/bin/env python3
# 使い方: python3 scripts/make_ticket_photos.py assets-src/ramen_original.jpg src/assets/images/tickets
# 元写真は AI Studio 版の高解像度ラーメン写真（1408x768）を想定。座標（cx / rim）はその写真に合わせてある。
"""ラーメン写真のヤサイの山だけを縦に伸縮させて、食券ごとの差分を作る。
丼の縁（rim）より上・丼の中心付近だけを変形し、上方向・左右へ滑らかに元に戻す。"""
import sys, numpy as np
from PIL import Image, ImageEnhance
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
def smooth(u):  # 0→1 の滑らかな立ち上がり
    u = np.clip(u, 0, 1); return u*u*(3-2*u)
def warp(k, cx=700, sigma=230, rim=455, band=430):
    xs = np.arange(W, dtype=np.float32); w = np.exp(-((xs-cx)**2)/(2*sigma**2))
    keff = 1 + (k-1)*w
    ys = np.arange(H, dtype=np.float32)[:,None]
    u = (rim - ys)/band                       # 縁=0、帯の上端=1
    taper = 1 - smooth((u-0.55)/0.45)         # 帯の上側 45% で変形を0に戻す
    disp = (rim-ys)*(1-1/keff[None,:])*taper  # 元画像を参照する位置のずれ
    ysrc = np.where((ys < rim) & (u <= 1), ys + disp, ys)
    ysrc = np.clip(ysrc, 0, H-1)
    y0 = np.floor(ysrc).astype(int); y1 = np.minimum(y0+1, H-1); t = (ysrc-y0)[...,None]
    X = np.broadcast_to(xs.astype(int)[None,:], (H,W))
    return im[y0, X]*(1-t) + im[y1, X]*t
for name,k,grade in [('easy',0.72,None),('normal',1.0,None),('hard',1.45,None),('super',1.25,'dark')]:
    img = Image.fromarray(warp(k).clip(0,255).astype(np.uint8))
    if grade=='dark':
        img = ImageEnhance.Contrast(img).enhance(1.18); img = ImageEnhance.Brightness(img).enhance(0.82)
    img = img.resize((1200, round(img.height*1200/img.width)), Image.LANCZOS)
    img.save(f'{out}/{name}.jpg', quality=82, optimize=True, progressive=True)
