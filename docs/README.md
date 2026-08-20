1. npm install --global surge
2. cd ./dist/
3. surge . publish

leetlab.surge.sh

# backup

timestamp=$(date +%Y-%m-%d) && git archive --format=zip --output="../leetlab-$timestamp-v1.0.0.zip" HEAD
