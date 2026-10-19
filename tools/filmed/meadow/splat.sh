#!/bin/zsh
# frames from the two orbit films -> COLMAP poses -> Brush splat training -> ply
set -e
cd "$(dirname "$0")"
rm -rf ds && mkdir -p ds/images
ffmpeg -loglevel error -y -i orbit.mp4 -vf fps=12 ds/images/lo_%03d.jpg -q:v 2
ffmpeg -loglevel error -y -i fly.mp4 -vf fps=12 ds/images/fly_%03d.jpg -q:v 2
echo "frames $(ls ds/images | wc -l)"
colmap feature_extractor --database_path ds/db.db --image_path ds/images --ImageReader.single_camera 1 --ImageReader.camera_model SIMPLE_PINHOLE --FeatureExtraction.use_gpu 0 > ds/colmap.log 2>&1
colmap exhaustive_matcher --database_path ds/db.db --FeatureMatching.use_gpu 0 >> ds/colmap.log 2>&1
mkdir -p ds/sparse && colmap mapper --database_path ds/db.db --image_path ds/images --output_path ds/sparse >> ds/colmap.log 2>&1
ls ds/sparse; colmap model_analyzer --path ds/sparse/0 2>&1 | tail -8
echo "COLMAP DONE"
../brush_dl/brush-app-aarch64-apple-darwin/brush_app ds --total-steps 12000 --max-splats 500000 --max-resolution 1280 --export-every 12000 --export-path out --export-name meadow.ply > brush.log 2>&1
ls -la out; echo "SPLAT DONE"
