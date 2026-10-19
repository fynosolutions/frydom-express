from pathlib import Path
from PIL import Image
folder = Path(__file__).resolve().parent.parent / 'docs' / 'qa' / 'intro-frames'
frames = [Image.open(p).convert('RGB').resize((720, 540), Image.Resampling.LANCZOS) for p in sorted(folder.glob('*.png'))]
destination = folder.parent.parent / 'screenshots' / 'home-opening.gif'
frames[0].save(destination, save_all=True, append_images=frames[1:], duration=[120] * 9 + [400, 1400], loop=0, optimize=True)
print(str(destination))
