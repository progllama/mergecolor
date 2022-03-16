const sharp = require('sharp');
const { program } = require('commander');

const fs = require('fs');
const { exit } = require('process');

RED_PRIORITY = 0;
GREEN_PRIORITY = 1;
BLUE_PRIORITY = 2;

SEARCH_RANGE = 1;

class Point
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    add(p) {
        return new Point(this.x+p.x, this.y+this.y);
    }
}

class Pixel
{
    constructor(x, y, r, g, b)
    {

    }
}

COMPARISON_RANGE = [
    new Point(-1, 1),
    new Point(0, 1),
    new Point(1, 1),
    new Point(-1, 0),
    new Point(1, 0),
    new Point(-1, -1),
    new Point(0, -1),
    new Point(1, -1),
]

async function main()
{
    program
        .option('--path <path>')
        .parse(process.argv);

    const opts = program.opts();

    console.log(opts.path);

    if (!fs.existsSync(opts.path))
    {
        console.log("指定されたパスがありません。");
        exit();
    }

    const img = await sharp(opts.path)
    const raw = await img.raw();
    const meta = await img.metadata();
    const width = meta.width;
    const height = meta.height;
    const buf = await raw.toBuffer();
    const output = new Uint8Array(width*height*3);

    console.log(height, width, output.length);

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            let candidate = undefined;
            let diff = 0;
            let currentPoint = new Point(x, y);
            let currentPixel = {
                r: buf[(y*width*3)+(x*3)],
                g: buf[(y*width*3)+(x*3)+1],
                b: buf[(y*width*3)+(x*3)+2],
            }
            for (let p of COMPARISON_RANGE)
            {
                let newPoint = p.add(currentPoint);
                if (newPoint.x < 0 || width <= newPoint.x)
                {
                    continue;
                }
                if (newPoint.y < 0 || height <= newPoint)
                {
                    continue;
                }
                let newPixel = {
                    r: buf[(newPoint.y*width*3)+(newPoint.x*3)],
                    g: buf[(newPoint.y*width*3)+(newPoint.x*3)+1],
                    b: buf[(newPoint.y*width*3)+(newPoint.x*3)+2],
                }
                let a = Math.pow((currentPixel.r - newPixel.r), 2)
                    + Math.pow((currentPixel.g - newPixel.g), 2)
                    + Math.pow((currentPixel.b - newPixel.b), 2);
                
                if (diff <= a)
                {
                    candidate = newPixel;
                }
            }
            output[(y*width*3)+(x*3)] = candidate['r'];
            output[(y*width*3)+(x*3)+1] = candidate['g'];
            output[(y*width*3)+(x*3)+2] = candidate['b'];
        }
    }

    sharp( output , 
        {
            raw:{
                width:meta.width,
                height:meta.height,
                channels:3,
            }
        } )
        .toFile('test1.jpeg');
}

main();