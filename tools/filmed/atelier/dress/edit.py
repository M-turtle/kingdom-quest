# dress a client still (on green) in a WHITE garment with Gemini image editing; usage: python3 edit.py <look> <client> <garment> [...]
import sys, io, json, time, pathlib
from google import genai
from google.genai import types
from PIL import Image
SRC = pathlib.Path('/private/tmp/claude-501/-Users-yonieyal-castle-chess/d9987f28-f2c5-4381-b2fb-abb4d8144d7e/scratchpad/atelier/assets')
G = {
 'skirt': 'a plain pure-white fabric skirt, knee length, gently flared, worn at her waist over her clothes, with a neat waistband',
 'circleSkirt': 'a plain pure-white fabric circle skirt, knee length, very full and twirly with soft folds all round, worn at her waist over her clothes',
 'belt': 'a plain pure-white fabric belt with a small gold buckle, worn snugly round her waist over her clothes',
 'hat': 'a plain pure-white fabric beret hat sitting on top of the head',
}
LOOK = {'felt': 'made of the same soft felt and stitching as the character', 'nature': 'made of soft cotton in the same clean 3D animated-film render as the character'}
def run(look, client, garment):
    out = pathlib.Path(f'{look}_{client}_{garment}.png')
    if out.exists(): return 'cached'
    img = (SRC / f'{look}_{client}.png').read_bytes()
    who = 'character'
    prompt = (f'Edit this image: dress the {who} in {G[garment]}, {LOOK[look]}. The new garment is pure white with soft shading and folds, no pattern, no colour. '
              'Keep everything else exactly the same: the same character, face, hair, pose, arms, proportions, colours and lighting, the same framing and size in the frame, '
              'and the same completely flat pure green background. Change nothing except adding the garment. No text.')
    client_ = genai.Client()
    for attempt in range(3):
        try:
            r = client_.models.generate_content(model='gemini-3.1-flash-image', contents=[types.Part.from_bytes(data=img, mime_type='image/png'), prompt],
                config=types.GenerateContentConfig(response_modalities=['IMAGE'], image_config=types.ImageConfig(aspect_ratio='9:16')))
            for c in r.candidates or []:
                for p in (getattr(c.content, 'parts', None) or []):
                    if getattr(p, 'inline_data', None) and p.inline_data.data:
                        Image.open(io.BytesIO(p.inline_data.data)).convert('RGB').save(out); return 'ok'
            return 'no image'
        except Exception as e:
            print('retry', type(e).__name__, str(e)[:120], flush=True); time.sleep(20)
    return 'fail'
look, client = sys.argv[1], sys.argv[2]
for g in sys.argv[3:]: print(look, client, g, run(look, client, g), flush=True)
with open('spend.log', 'a') as f: f.write(f'{time.time():.0f} {look} {client} {" ".join(sys.argv[3:])}\n')
