import io, time, pathlib, concurrent.futures as cf
from google import genai
from google.genai import types
from PIL import Image
LOOK = {'felt': 'made of soft thick felt, like premium handmade felt toys, fuzzy texture, stitched edge, premium 3D animated-film render, soft warm studio light',
        'nature': 'made of soft woven cotton fabric, clean modern stylised 3D animated-film render, bright soft daylight'}
GREEN = ', alone, centred, seen exactly from straight above, lying flat on a completely flat uniform pure bright green screen background (#00FF00), nothing else in the frame, soft natural shadow only under the cloth. Absolutely no text, no digits, no markings, no logos'
J = {}
for lk, L in LOOK.items():
    J[f'cl_disc_{lk}'] = (f'A large perfectly round flat piece of plain pure white cloth, {L}, with gentle soft folds and a slightly wavy edge' + GREEN, '1:1')
    J[f'cl_strip_{lk}'] = (f'A long straight narrow flat strip of plain pure white cloth lying horizontally across the whole frame, {L}, with a few soft wrinkles' + GREEN, '16:9')
    J[f'cl_sheet_{lk}'] = (f'A large flat square sheet of plain pure white cloth filling most of the frame, {L}, with gentle soft folds near the edges' + GREEN, '1:1')
    J[f'beam_{lk}'] = (f'A beam compass for drawing circles on cloth, seen exactly from straight above, lying perfectly straight and horizontal across the whole frame: one long perfectly straight flat wooden bar, a sharp metal pin holder clamped at the far left end, nothing at the right end, {"felt toy style" if lk=="felt" else "clean modern style with a thin cyan accent line"}, premium 3D render' + GREEN, '16:9')
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
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(one, J): print(r, flush=True)
