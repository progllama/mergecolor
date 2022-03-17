const sharp = require('sharp');
const { program } = require('commander');

const fs = require('fs');
const { exit } = require('process');

RED_PRIORITY = 0;
GREEN_PRIORITY = 1;
BLUE_PRIORITY = 2;

SEARCH_RANGE = 1;

class Image {
    constructor() {
        this.sharp = undefined;
    }

    async init() {
        const rawImage = await this.sharp.raw();
        const meta = await rawImage.metadata();

        this.rawImage = rawImage;

        this.height = meta.height;
        this.width = meta.width;

        this.pixels = await this.rawImage.toBuffer();
    }

    getPixel(x, y) {
        if (x < 0 || this.width <= x) {
            throw Error("out of width");
        }
        if (y < 0 || this.height <= y) {
            throw Error("out of width");
        }
        
        const baseIndex = (y * this.width * 3) + (x * 3);
        const rIndex = baseIndex;
        const gIndex = baseIndex + 1;
        const bIndex = baseIndex + 2;
        new Pixel(
            this.buf[rIndex],
            this.buf[gIndex],
            this.buf[bIndex],
        );
    }
}

function CreateImage(srcPath) {
    if (!fs.existsSync(srcPath)) {
        exit(1);
    }

    const img = new Image();
    img.sharp = sharp(srcPath);
    img.init();
    return img;
}

function SavePixelsAsImage(pixels, height, width, dest) {
    const buf = new Uint8Array(height * width * 3);

    for (let i = 0; i < pixels.length; i++) {
        buf[i*3] // add red
        buf[i*3+1] // add green
        buf[i*3+2] // add blue
    }

    sharp( buf , 
        {
            raw:{
                width: width,
                height: height,
                channels:3,
            }
        } )
        .toFile(dest);
}

class Pixel {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(p) {
        return new Point(this.x+p.x, this.y+p.y);
    }
}

COMPARISON_TARGETS = [
    new Point(-1, 1),
    new Point(0, 1),
    new Point(1, 1),
    new Point(-1, 0),
    new Point(1, 0),
    new Point(-1, -1),
    new Point(0, -1),
    new Point(1, -1),
]

async function main() {
    program
        .option('--path <path>')
        .parse(process.argv);

    const opts = program.opts();

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
    let buf = await raw.toBuffer();
    let output = new Uint8Array(width*height*3);

    for (let i = 0; i < 2; i++)
    {
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

            for (let p of COMPARISON_TARGETS)
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
                // console.log(newPoint);
                let newPixel = {
                    r: buf[(newPoint.y*width*3)+(newPoint.x*3)],
                    g: buf[(newPoint.y*width*3)+(newPoint.x*3)+1],
                    b: buf[(newPoint.y*width*3)+(newPoint.x*3)+2],
                }
                let a = Math.pow((currentPixel.r - newPixel.r), 2)
                    + Math.pow((currentPixel.g - newPixel.g), 2)
                    + Math.pow((currentPixel.b - newPixel.b), 2);
                
                // if (x == 100)
                // console.log(newPixel, a);
                
                if (diff <= a)
                {
                    diff = a;
                    candidate = newPixel;
                }
            }
            // if (x == 100)
            // console.log(candidate);
            // console.log(currentPixel);
            output[(y*width*3)+(x*3)] = candidate['r'];
            output[(y*width*3)+(x*3)+1] = candidate['g'];
            output[(y*width*3)+(x*3)+2] = candidate['b'];
        }
        // if (y == 50)
        // break;
    }
    buf = output;
    output = new Uint8Array(width*height*3);
    }

    // return;
}

class MergeProcess {
    constructor(img, strategy) {
        this.img = img;
        this.strategy = strategy;
        this.outputPixels = new Array(width * height);
    }

    execute() {
        this.processPixels();
        return this.output;
    }

    processPixels() {
        for (y = 0; y < img.height; y++) {
            for (x = 0; x < img.width; x++) {
                this.processPixel(x, y);
            }
        }
    }

    processPixel(x, y) {
        while(!this.strategy.completes) {
            this.applyStrategy(x, y)
        }
    }

    applyStrategy(x, y) {
        const comparisonPositions = this.strategy.getComparisonPositions(x, y);
        const comparisonPixels = this.getComparisonPixels(x, y, comparisonPositions);
        this.strategy.setComparisonPixels(comparisonPixels);

        this.strategy.execute();
    }

    getComparisonPixels(x, y, comparisonPositions) {
        const comparisonPixels = [];
        for (let position of comparisonPositions) {
            const pixel = this.img.getPixel(position.x+x, position.y+y);
            comparisonPixels.push(pixel);
        }
        return comparisonPixels;
    }
}

main();