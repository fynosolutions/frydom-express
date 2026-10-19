"""Package the reviewed source and static output without node_modules or secrets."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
output = root / 'deliverables'
output.mkdir(exist_ok=True)
folders = ['src', 'public', 'scripts', 'tests', 'sources', 'docs', 'dist']
files = ['README.md', 'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json', 'playwright.config.mjs', '.gitignore', '.vercelignore', 'vercel.json', '启动预览.cmd']
source_files = [p for folder in folders for p in (root / folder).rglob('*') if p.is_file()]
source_files += [root / name for name in files]
archives = []
for name, paths, base in [('FrydomExpress-source.zip', source_files, root), ('FrydomExpress-static.zip', [p for p in (root / 'dist').rglob('*') if p.is_file()], root / 'dist')]:
    destination = output / name
    with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for item in sorted(paths):
            archive.write(item, item.relative_to(base).as_posix())
    with zipfile.ZipFile(destination) as archive:
        assert archive.testzip() is None, 'Archive integrity failed'
        assert not any('/node_modules/' in p or '/.git/' in p or p.startswith('.env') for p in archive.namelist())
        entries = len(archive.namelist())
    archives.append({'file': name, 'bytes': destination.stat().st_size, 'entries': entries, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()})
(output / 'manifest.json').write_text(json.dumps(archives, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(archives, ensure_ascii=False))
