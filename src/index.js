const sharp = require('sharp');
const { program } = require('commander');

const fs = require('fs');
const { exit } = require('process');

program
    .option('--path <path>')
    .parse(process.argv);

const opts = program.opts();

console.log(opts.path);

if (!fs.existsSync(opts.path)) {
    console.log("指定されたパスがありません。");
    exit();
}

sharp(opts.path);