#! /usr/bin/env node

var path = require('path');
var sh = require('shelljs');
var packageJson = require(path.resolve(process.cwd(), './package.json'));
var config = packageJson['github-pages-deploy'] || {};

sh.config.silent = true;

var src = config.src || 'gh-pages';

sh.exec('mkdir -p .publish');
sh.cd('.publish');
var remoteUrl = sh.exec('git config --get remote.origin.url').output.trim();

var dotgit = sh.exec('ls .git');
if(dotgit.code === 1) sh.exec('git clone ' + remoteUrl + ' .');


sh.exec('git checkout -t origin/gh-pages');

sh.exec('git rm -r .');
sh.exec('cp -R ../' + src + '/* .');
sh.exec('git add -A .');
sh.exec('git commit -m "update gh-pages ' + new Date().toISOString() + '"');
sh.exec('git push');
