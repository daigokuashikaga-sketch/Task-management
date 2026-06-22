#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
タスク管理アプリの実演デモ動画を生成する（ブラウザ録画が不可な環境向けに UI を再現）。
出力: presentation/demo.mp4（約36秒, 1280x720, H.264）と poster.png
"""
import os
import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
FPS = 15
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"

# 明るくシンプルなパレット
BG = (248, 250, 252)       # slate-50
CARD = (255, 255, 255)
BORDER = (226, 232, 240)   # slate-200
INK = (30, 41, 59)         # slate-800
MUTED = (100, 116, 139)    # slate-500
ACCENT = (37, 99, 235)     # blue-600
RED = (220, 38, 38)
AMBER = (217, 119, 6)
GREEN = (22, 163, 74)
COL_TODO = (241, 245, 249)
COL_PROG = (219, 234, 254)
COL_DONE = (220, 252, 231)

_fonts = {}
def font(sz, ):
    if sz not in _fonts:
        _fonts[sz] = ImageFont.truetype(FONT, sz)
    return _fonts[sz]

def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def new_frame():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)

def rrect(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def text(d, xy, s, sz, fill=INK, anchor="la", font_obj=None):
    d.text(xy, s, font=font_obj or font(sz), fill=fill, anchor=anchor)

def center_text(d, cx, y, s, sz, fill=INK):
    d.text((cx, y), s, font=font(sz), fill=fill, anchor="ma")

def chip(d, x, y, label, fg, bg):
    f = font(20)
    tw = d.textlength(label, font=f)
    rrect(d, [x, y, x + tw + 24, y + 30], 15, fill=bg)
    d.text((x + 12, y + 5), label, font=f, fill=fg)
    return tw + 24

def header(d, email="user@example.com"):
    text(d, (60, 40), "タスク管理", 34, INK)
    text(d, (60, 86), "Next.js（App Router）製 フルスタック・タスク管理アプリ", 18, MUTED)
    text(d, (W - 60, 48), email, 18, MUTED, anchor="ra")
    rrect(d, [W - 160, 78, W - 60, 110], 8, outline=BORDER, width=2)
    text(d, (W - 110, 84), "サインアウト", 16, MUTED, anchor="ma")

def prio_chip(d, x, y, level):
    m = {"高": (RED, (254, 226, 226)), "中": (AMBER, (254, 243, 199)), "低": (GREEN, (220, 252, 231))}
    fg, bg = m[level]
    return chip(d, x, y, "優先度: " + level, fg, bg)

def task_card(d, x, y, w, title, tags, prio, done=False, reveal=None):
    h = 96
    rrect(d, [x, y, x + w, y + h], 12, fill=CARD, outline=BORDER, width=2)
    t = title if reveal is None else title[:reveal]
    text(d, (x + 18, y + 16), t, 22, MUTED if done else INK)
    if done:
        d.line([x + 18, y + 28, x + 18 + d.textlength(t, font=font(22)), y + 28], fill=MUTED, width=2)
    cx = x + 18
    cx += prio_chip(d, cx, y + 52, prio) + 10
    for tg in tags:
        cx += chip(d, cx, y + 52, "#" + tg, ACCENT, (224, 231, 255)) + 8

frames = []
def hold(img, seconds):
    for _ in range(int(seconds * FPS)):
        frames.append(np.asarray(img).copy())

# ---------- Scene 1: ログイン ----------
def scene_login():
    n = int(3.0 * FPS)
    typed = "student@example.com"
    for i in range(n):
        img, d = new_frame()
        # 中央カード
        cw, ch = 520, 420
        cx0 = (W - cw) // 2
        cy0 = (H - ch) // 2
        rrect(d, [cx0, cy0, cx0 + cw, cy0 + ch], 18, fill=CARD, outline=BORDER, width=2)
        center_text(d, W // 2, cy0 + 40, "ログイン", 34, INK)
        center_text(d, W // 2, cy0 + 92, "タスク管理にサインインしてください", 18, MUTED)
        # email
        text(d, (cx0 + 50, cy0 + 140), "メールアドレス", 18, INK)
        rrect(d, [cx0 + 50, cy0 + 170, cx0 + cw - 50, cy0 + 210], 8, fill=(255, 255, 255), outline=BORDER, width=2)
        rev = min(len(typed), int(i / (n * 0.7) * len(typed)))
        text(d, (cx0 + 66, cy0 + 180), typed[:rev], 20, INK)
        # password
        text(d, (cx0 + 50, cy0 + 230), "パスワード", 18, INK)
        rrect(d, [cx0 + 50, cy0 + 260, cx0 + cw - 50, cy0 + 300], 8, fill=(255, 255, 255), outline=BORDER, width=2)
        pw = "•" * min(9, max(0, int((i - n * 0.5) / (n * 0.4) * 9)))
        text(d, (cx0 + 66, cy0 + 268), pw, 22, INK)
        # button
        pressed = i > n - 6
        bcol = (15, 23, 42) if pressed else INK
        rrect(d, [cx0 + 50, cy0 + 330, cx0 + cw - 50, cy0 + 374], 8, fill=bcol)
        center_text(d, W // 2, cy0 + 340, "サインイン" if not pressed else "サインイン中…", 20, (255, 255, 255))
        frames.append(np.asarray(img).copy())

# ---------- Scene 2: ホーム＋タスク作成（入力） ----------
def scene_create():
    title = "採用面談の準備をする"
    n = int(5.5 * FPS)
    for i in range(n):
        img, d = new_frame()
        header(d, "student@example.com")
        # フォーム
        fx, fy, fw = 60, 140, W - 120
        rrect(d, [fx, fy, fx + fw, fy + 150], 12, fill=CARD, outline=BORDER, width=2)
        # title input
        rrect(d, [fx + 20, fy + 20, fx + fw - 20, fy + 60], 8, outline=BORDER, width=2)
        rev = min(len(title), int(i / (n * 0.6) * len(title)))
        shown = title[:rev]
        text(d, (fx + 34, fy + 28), shown if shown else "タイトル（必須）", 22,
             INK if shown else (148, 163, 184))
        if rev < len(title) and (i // 3) % 2 == 0:
            cxx = fx + 34 + d.textlength(shown, font=font(22))
            d.line([cxx + 2, fy + 30, cxx + 2, fy + 54], fill=INK, width=2)
        # tag input + priority + button
        text(d, (fx + 20, fy + 78), "タグ: 仕事, 重要", 18, MUTED)
        prio_chip(d, fx + 240, fy + 74, "高")
        pressed = i > n - 8
        rrect(d, [fx + fw - 200, fy + 95, fx + fw - 20, fy + 135], 8, fill=(15, 23, 42) if pressed else INK)
        center_text(d, fx + fw - 110, fy + 103, "タスクを追加" if not pressed else "追加中…", 20, (255, 255, 255))
        # 既存タスク（あらかじめ2件）
        task_card(d, 60, 320, W - 120, "README を仕上げる", ["ドキュメント"], "中")
        task_card(d, 60, 432, W - 120, "テストを追加する", ["開発"], "低", done=True)
        # 最後に新規が出現
        if i > n - 8:
            task_card(d, 60, 320 - 0, W - 120, "採用面談の準備をする", ["仕事", "重要"], "高")
            task_card(d, 60, 432, W - 120, "README を仕上げる", ["ドキュメント"], "中")
        frames.append(np.asarray(img).copy())

# ---------- Scene 3: カンバン（ドラッグ＆ドロップ） ----------
def kanban_base(d, drag_pos=None, dragging_title=None):
    header(d)
    text(d, (60, 150), "ボード表示（ドラッグ＆ドロップで状態変更）", 20, INK)
    cols = [("未着手", COL_TODO), ("進行中", COL_PROG), ("完了", COL_DONE)]
    cw = (W - 120 - 40) // 3
    for idx, (name, col) in enumerate(cols):
        x = 60 + idx * (cw + 20)
        rrect(d, [x, 185, x + cw, 690], 12, fill=col, outline=BORDER, width=1)
        text(d, (x + 16, 198), name, 22, INK)
    return cw

def mini_card(d, x, y, w, title, tags, prio, ghost=False):
    h = 84
    fill = CARD if not ghost else (255, 255, 255)
    rrect(d, [x, y, x + w, y + h], 10, fill=fill, outline=ACCENT if ghost else BORDER, width=2)
    text(d, (x + 14, y + 12), title, 19, INK)
    cx = x + 14
    m = {"高": (RED, (254, 226, 226)), "中": (AMBER, (254, 243, 199)), "低": (GREEN, (220, 252, 231))}
    fg, bg = m[prio]
    cx += chip(d, cx, y + 44, prio, fg, bg) + 8
    for tg in tags[:1]:
        chip(d, cx, y + 44, "#" + tg, ACCENT, (224, 231, 255))

def scene_kanban():
    n = int(5.5 * FPS)
    cw = (W - 120 - 40) // 3
    x_todo = 60 + 16
    x_prog = 60 + (cw + 20) + 16
    for i in range(n):
        img, d = new_frame()
        kanban_base(d)
        # 静的カード
        mini_card(d, x_prog, 240, cw - 32, "API設計を見直す", ["開発"], "中")
        mini_card(d, 60 + 2 * (cw + 20) + 16, 240, cw - 32, "環境構築", ["開発"], "低")
        # ドラッグ中のカード: todo -> prog
        t = ease(i / (n - 1))
        sx, sy = x_todo, 240
        ex, ey = x_prog, 336
        cxp = sx + (ex - sx) * t
        cyp = sy + (ey - sy) * t
        # 元位置のゴースト
        if t < 0.95:
            rrect(d, [x_todo, 240, x_todo + cw - 32, 324], 10, fill=(248, 250, 252), outline=BORDER, width=1)
        mini_card(d, int(cxp), int(cyp), cw - 32, "採用面談の準備をする", ["仕事"], "高", ghost=True)
        # カーソル
        d.polygon([(cxp + 40, cyp + 30), (cxp + 40, cyp + 54), (cxp + 47, cyp + 47),
                   (cxp + 53, cyp + 47)], fill=INK)
        frames.append(np.asarray(img).copy())

# ---------- Scene 4: 検索・絞り込み ----------
def scene_filter():
    n = int(4.5 * FPS)
    query = "面談"
    for i in range(n):
        img, d = new_frame()
        header(d)
        # 検索ボックス
        rrect(d, [60, 150, 520, 192], 8, fill=CARD, outline=BORDER, width=2)
        rev = min(len(query), int(i / (n * 0.4) * len(query)))
        text(d, (78, 159), query[:rev] if rev else "検索（タイトル・説明）", 20,
             INK if rev else (148, 163, 184))
        # タブ
        tabs = ["すべて", "未着手", "進行中", "完了"]
        tx = 560
        for j, tb in enumerate(tabs):
            active = j == 0
            w = d.textlength(tb, font=font(18)) + 28
            rrect(d, [tx, 152, tx + w, 190], 19, fill=INK if active else None,
                  outline=None if active else BORDER, width=2)
            text(d, (tx + 14, 159), tb, 18, (255, 255, 255) if active else MUTED)
            tx += w + 10
        # サマリー
        text(d, (60, 210), "未着手 2 ・ 進行中 1 ・ 完了 1", 18, MUTED)
        # 結果（絞り込み後は1件にフォーカス）
        if i < n * 0.45:
            task_card(d, 60, 250, W - 120, "採用面談の準備をする", ["仕事", "重要"], "高")
            task_card(d, 60, 362, W - 120, "README を仕上げる", ["ドキュメント"], "中")
            task_card(d, 60, 474, W - 120, "テストを追加する", ["開発"], "低", done=True)
        else:
            rrect(d, [56, 246, W - 56, 358], 14, outline=ACCENT, width=3)
            task_card(d, 60, 250, W - 120, "採用面談の準備をする", ["仕事", "重要"], "高")
            text(d, (60, 380), "「面談」に一致：1 件", 20, ACCENT)
        frames.append(np.asarray(img).copy())

# ---------- Scene 5: 品質エンドカード ----------
def scene_outro():
    img, d = new_frame()
    center_text(d, W // 2, 150, "実運用品質を意識した設計", 40, INK)
    items = [
        "認証 & マルチテナント（ユーザーごとにデータ隔離）",
        "ストレージ差し替え可能（JSON / メモリ / PostgreSQL）",
        "テスト 71 件・カバレッジ 82% を CI で強制",
        "セキュリティヘッダ・構造化ログ・ヘルスチェック",
    ]
    y = 250
    for it in items:
        d.ellipse([W // 2 - 320, y + 8, W // 2 - 304, y + 24], fill=ACCENT)
        text(d, (W // 2 - 290, y), it, 26, INK)
        y += 70
    hold(img, 3.0)

def hold_last(seconds):
    frames.append(frames[-1].copy())  # ensure exists
    img = Image.fromarray(frames[-1])
    hold(img, seconds)

scene_login()
hold_last(0.6)
scene_create()
hold_last(1.8)   # 作成結果を見せる間
scene_kanban()
hold_last(1.4)   # ドロップ後の状態を見せる間
scene_filter()
hold_last(1.6)   # 絞り込み結果を見せる間
scene_outro()

print(f"総フレーム数: {len(frames)}  概算秒数: {len(frames)/FPS:.1f}s")

# poster（ホーム作成画面の1枚）
Image.fromarray(frames[FPS * 3]).save(os.path.join(HERE, "poster.png"))

out = os.path.join(HERE, "demo.mp4")
writer = imageio.get_writer(out, fps=FPS, codec="libx264", quality=7,
                            ffmpeg_params=["-pix_fmt", "yuv420p"])
for f in frames:
    writer.append_data(f)
writer.close()
print("動画出力:", out, f"{os.path.getsize(out)/1e6:.2f} MB")
