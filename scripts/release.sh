#!/bin/sh

set -e
echo "Run test... "

npm run jest
npm run build
npm run test

echo "Enter commit message: "
read MESSAGE

read -p "Releasing $VERSION - are you sure? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Releasing $VERSION ..."
  # commit
  git add -A
  git commit -m "[build] $VERSION,[message] $MESSAGE"
  npm version $VERSION --message "[release] $VERSION"

  # publish
  git push origin refs/tags/v$VERSION
  git push
  npm publish
fi