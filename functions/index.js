const functions = require("firebase-functions");
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { initializeApp, credential } = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//

const getColorName = async (r, g, b) => {
  const colorNames = [
    {name: "black", r: 0, g: 0, b: 0},
    {name: "white", r: 255, g: 255, b: 255},
    {name: "red", r: 255, g: 0, b: 0},
    {name: "orange", r: 255, g: 165, b: 0},
    {name: "yellow", r: 255, g: 255, b: 0},
    {name: "green", r: 0, g: 128, b: 0},
    {name: "blue", r: 0, g: 0, b: 255},
    {name: "purple", r: 128, g: 0, b: 128},
    {name: "pink", r: 255, g: 192, b: 203},
    {name: "brown", r: 139, g: 69, b: 19},
    {name: "gray", r: 128, g: 128, b: 128},
    {name: "maroon", r: 128, g: 0, b: 0},
    {name: "teal", r: 0, g: 128, b: 128},
    {name: "navy", r: 0, g: 0, b: 128},
    {name: "olive", r: 128, g: 128, b: 0},
    {name: "magenta", r: 255, g: 0, b: 255},
    {name: "turquoise", r: 64, g: 224, b: 208},
    {name: "lavender", r: 230, g: 230, b: 250},
    {name: "coral", r: 255, g: 127, b: 80},
    {name: "salmon", r: 250, g: 128, b: 114},
    {name: "beige", r: 245, g: 245, b: 220},
    {name: "chocolate", r: 210, g: 105, b: 30},
    {name: "crimson", r: 220, g: 20, b: 60},
    {name: "gold", r: 255, g: 215, b: 0},
    {name: "indigo", r: 75, g: 0, b: 130},
    {name: "khaki", r: 240, g: 230, b: 140},
    {name: "lime", r: 0, g: 255, b: 0},
    {name: "plum", r: 221, g: 160, b: 221},
    {name: "sienna", r: 160, g: 82, b: 45},
    {name: "tan", r: 210, g: 180, b: 140},
    {name: "violet", r: 238, g: 130, b: 238}
  ];
  let minDistance = Infinity;
  let closestColor = null;
  for (let i = 0; i < colorNames.length; i++) {
    const color = colorNames[i];
    const distance = Math.sqrt(
      Math.pow(color.r - r, 2) +
      Math.pow(color.g - g, 2) +
      Math.pow(color.b - b, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }
  return closestColor.name;
}

const hashPtoken = async (type, heading, darken, width, height) => {
  return [type, heading, darken, width, height].join("-")
}

const saveToTempFile = async(data) => {
  const tempFilePath = path.join(os.tmpdir(), 'output.jpg')
  await fs.promises.writeFile(tempFilePath, data)
  return tempFilePath
}

const downloadFromStorage = async (bucket, fileName) => {
  try {
    const contents = await bucket.file(fileName).download()
    return contents
  } catch (e) {
    functions.logger.error(e, {structuredData: true})
    return null
  }
}

const uploadFile = async (bucket, filePath, options) => {
  await bucket.upload(filePath, options);
}

let HASINITED = false
let bucket = null

exports.getBlogCover = functions.runWith({ secrets: ["BCG_PROJECT_ID", "BCG_PRIVATE_KEY", "BCG_CLIENT_EMAIL"] }).https.onRequest(async (request, response) => {
  if (!HASINITED) {
    initializeApp({
      credential: credential.applicationDefault(),
      storageBucket: `${process.env.BCG_PROJECT_ID}.appspot.com`
    })
    bucket = getStorage().bucket()
    HASINITED = true
  }
  let { type, heading, darken, width, height, persist } = request.query;
  width = width ? parseInt(width) : 1200
  height = height ? parseInt(height) : 630
  darken = darken ? parseInt(darken) : 6
  type = type ? type : "programming"
  heading = heading ? decodeURI(heading) : "Hello World!"
  persist = persist && persist === "true" ? await hashPtoken(type, heading, darken, width, height) : false
  if (persist) {
    let image = await downloadFromStorage(bucket, `${persist}.jpeg`)
    if (image !== null) {
      let filePath = await saveToTempFile(image)
      response.sendFile(filePath)
      return
    }
  }
  const unsplashResponse = await axios.get(`https://source.unsplash.com/featured/?${type}`)
  const imageBuffer = await axios.get(unsplashResponse.request.res.responseUrl, { responseType: 'arraybuffer' })
  let sharpObject =  await sharp(imageBuffer.data)
  const { entropy, sharpness, dominant } = await sharpObject.stats();
  let textColor = await getColorName(dominant.r, dominant.g, dominant.b)
  functions.logger.info(textColor, {structuredData: true});
  const image = await sharpObject
    .resize({ width, height })
    .composite([{
      input: {
        create: {
          width,
          height,
          channels: 4,
          background: { r: 255-dominant.r, g: 255-dominant.g, b: 255-dominant.b, alpha: darken / 10 }
        }
      }
    },
    {
      input: {
        text: {
          text: `<span foreground="${textColor}">${heading}</span>`,
          font: 'Copperplate',
          width: Math.round(0.58 * width),
          height: Math.round(0.31 * height),
          rgba: true,
        },
      },
      left: 80,
      top: Math.round(0.55 * height),
    }
    ])
    .toBuffer()
  
  let filePath = await saveToTempFile(image)
  if (persist) {
    await uploadFile(bucket, filePath, {destination:`${persist}.jpeg`})
  }
  functions.logger.info("Rendered succesfully!", {structuredData: true});
  response.sendFile(filePath);
});

exports.index = functions.https.onRequest(async (request, response) => {
  response.redirect("https://github.com/44za12/blog-cover-generator");
});
