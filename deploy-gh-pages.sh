#!/bin/bash
npm run build
cd dist
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:ekadetov/meditation-bell.git main:gh-pages
cd ..
