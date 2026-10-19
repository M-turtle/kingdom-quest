import io, time, pathlib, concurrent.futures as cf
from google import genai
from google.genai import types
from PIL import Image
LOOK = {'felt': 'everything made of soft plush and felt like premium toys, stitched seams, fuzzy textures, premium 3D animated-film render, warm soft light',
        'nature': 'clean modern stylised 3D animated-film render, nature-tech look: light wood, warm sandstone, a thin cyan accent line, a small living plant, bright soft daylight'}
NO = '. Absolutely no text, no digits, no numbers, no letters, no markings, no logos anywhere.'
J = {}
for lk, L in LOOK.items():
    J[f'table_{lk}'] = (f'A view looking straight down from above at a big tailor cutting table filling the whole frame: a wide plain empty cream cutting surface in the middle, a wooden table edge along the bottom, a pincushion and a few thread spools only in the top corners, the centre completely empty, {L}' + NO, '16:9')
    J[f'rulerblank_{lk}'] = (f'A single long straight plain blank ruler-shaped strip of pale wood, lying perfectly horizontal across the whole width of the frame, seen straight from above, completely blank with no tick marks, on a flat pure green background (#00FF00), {L}' + NO, '16:9')
    J[f'tapeblank_{lk}'] = (f'A single long straight strip of yellow tailor measuring tape lying perfectly horizontal across the whole width of the frame, seen straight from above, completely blank with no tick marks, a small metal tip at the left end, on a flat pure green background (#00FF00), {L}' + NO, '16:9')
def one(k):
    out = pathlib.Path(k + '.png')
    if out.exists(): return k, 'cached'
    prompt, fmt = J[k]; c = genai.Client()
    for a in range(3):
        try:
            r = c.models.generate_content(model='gemini-3.1-flash-image', contents=[prompt], config=types.GenerateContentConfig(response_modalities=['IMAGE'], image_config=types.ImageConfig(aspect_ratio=fmt)))
            for cand in r.candidates or []:
                for p in (getattr(cand.content, 'parts', None) or []):
                    if getattr(p, 'inline_data', None) and p.inline_data.data: Image.open(io.BytesIO(p.inline_data.data)).convert('RGB').save(out); return k, 'ok'
            return k, 'no image'
        except Exception as e: print('retry', k, str(e)[:100], flush=True); time.sleep(20)
    return k, 'fail'
with cf.ThreadPoolExecutor(3) as ex:
    for r in ex.map(one, J): print(r, flush=True)
