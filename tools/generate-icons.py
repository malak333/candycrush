"""Rebuild the original Sugar Spell app icons. Requires Pillow; no downloaded art."""
from math import cos, sin, pi
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'public'
scale = 3
size = 512 * scale
art = Image.new('RGB', (size, size), '#fff5ed')
d = ImageDraw.Draw(art)
def box(values):
    return tuple(round(v * scale) for v in values)
d.rounded_rectangle(box((0, 0, 512, 512)), radius=112*scale, fill='#8b49a5')
d.rounded_rectangle(box((12, 10, 500, 498)), radius=105*scale, fill='#9b59b5')
d.ellipse(box((-80, -180, 500, 370)), fill='#ae6ac4')
d.line(box((234, 288, 304, 405)), fill='#69358c', width=37*scale)
d.line(box((226, 280, 296, 397)), fill='#fff3df', width=25*scale)
d.ellipse(box((109, 91, 405, 387)), fill='#833e89')
d.ellipse(box((102, 76, 398, 372)), fill='#ffdba4')
d.ellipse(box((113, 85, 387, 359)), fill='#eb5a9b')
d.ellipse(box((125, 92, 375, 342)), fill='#fa79b0')
points = []
for n in range(330):
    angle = n / 329 * pi * 5.2
    radius = 5 + 104 * n / 329
    points.append((int((250 + cos(angle)*radius)*scale), int((222 + sin(angle)*radius)*scale)))
d.line(points, fill='#fff4d8', width=21*scale, joint='curve')
d.ellipse(box((151, 111, 214, 135)), fill='#ffc0d5')
def sparkle(x, y, r, color):
    d.polygon([(int((x+dx*r)*scale),int((y+dy*r)*scale)) for dx,dy in [(0,-1),(.25,-.25),(1,0),(.25,.25),(0,1),(-.25,.25),(-1,0),(-.25,-.25)]], fill=color)
sparkle(414,114,27,'#ffe7a0')
sparkle(96,382,21,'#fff3de')
sparkle(401,351,14,'#ffc1dc')
for filename, dimension in [('icon-512.png',512),('icon-192.png',192),('apple-touch-icon.png',180)]:
    art.resize((dimension,dimension), Image.Resampling.LANCZOS).save(root / filename, optimize=True)
print('Generated three Sugar Spell icons.')
