"""Build OFL derivatives with 110% horizontal outlines and matching metrics.
Run with fonttools and brotli available in the Python environment.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/fonts/frydom-wide'
DEST.mkdir(parents=True, exist_ok=True)
FACTOR = 1.1

def build(source, license_path, name, filename):
    font = TTFont(ROOT / source)
    glyphset = font.getGlyphSet()
    outlines = {}
    for glyph_name in font.getGlyphOrder():
        recording = DecomposingRecordingPen(glyphset)
        glyphset[glyph_name].draw(recording)
        pen = TTGlyphPen(None)
        recording.replay(TransformPen(pen, (FACTOR, 0, 0, 1, 0, 0)))
        outlines[glyph_name] = pen.glyph()
    font['glyf'].glyphs = outlines
    for glyph_name, (advance, bearing) in list(font['hmtx'].metrics.items()):
        font['hmtx'].metrics[glyph_name] = (round(advance * FACTOR), round(bearing * FACTOR))
    # Scale horizontal shaping adjustments along with glyph advances.
    seen = set()
    def scale_layout(obj):
        if id(obj) in seen:
            return
        seen.add(id(obj))
        if isinstance(obj, (list, tuple)):
            for child in obj:
                scale_layout(child)
        elif hasattr(obj, '__dict__'):
            for key, value in vars(obj).items():
                if key in ('XAdvance', 'XPlacement', 'XCoordinate') and isinstance(value, (int, float)):
                    setattr(obj, key, round(value * FACTOR))
                else:
                    scale_layout(value)
    if 'GPOS' in font:
        scale_layout(font['GPOS'].table)
    if 'kern' in font:
        for table in font['kern'].kernTables:
            if hasattr(table, 'kernTable'):
                table.kernTable = {pair: round(value * FACTOR) for pair, value in table.kernTable.items()}
    font['OS/2'].xAvgCharWidth = round(font['OS/2'].xAvgCharWidth * FACTOR)
    font['OS/2'].usWidthClass = 6
    # Both upstream licenses reserve their original names for unmodified fonts.
    values = {1:name, 2:'Regular', 3:name+' 1.0', 4:name, 6:name.replace(' ',''), 16:name, 17:'Regular', 18:name}
    for record in font['name'].names:
        if record.nameID in values:
            record.string = values[record.nameID].encode(record.getEncoding())
    font.flavor = 'woff2'
    font.save(DEST / filename)
    shutil.copyfile(ROOT / license_path, DEST / (filename.replace('.woff2','-OFL.txt')))
    check = TTFont(DEST / filename)
    assert len(check.getGlyphOrder()) == len(outlines)
    print(filename, len(outlines), 'glyphs; horizontal scale', FACTOR)

build('public/assets/fonts/crav/MouseMemoirs-latin.woff2', 'public/assets/fonts/crav/MouseMemoirs-OFL.txt', 'Frydom Display Wide', 'FrydomDisplayWide.woff2')
build('public/assets/fonts/smiley-sans/SmileySans-Oblique.woff2', 'public/assets/fonts/smiley-sans/OFL.txt', 'Frydom Han Wide', 'FrydomHanWide.woff2')
