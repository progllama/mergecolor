const sharp = require('sharp');
const { program } = require('commander');

const fs = require('fs');
const { exit } = require('process');

async function main() {
    program
        .option('--path <path>')
        .parse(process.argv);

    const opts = program.opts();

    console.log(opts.path);

    if (!fs.existsSync(opts.path)) {
        console.log("指定されたパスがありません。");
        exit();
    }

    const img = await sharp(opts.path)
    const raw = await img.raw();
    const meta = await img.metadata();

    console.log(meta);


    const reversed = (await raw.toBuffer()).reverse();

    sharp( reversed , 
        {
            raw:{
                width:meta.width,
                height:meta.height,
                channels:3,
            }
        } )
        .rotate(180)
        .toFile('test1.jpeg');
}

main();