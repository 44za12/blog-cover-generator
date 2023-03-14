const functions = require("firebase-functions");
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs');
// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
exports.getBlogCover = functions.https.onRequest(async (request, response) => {
  let { type, heading, darken, width, height } = request.query;
  width = width ? parseInt(width) : 1200
  height = height ? parseInt(height) : 630
  darken = darken ? parseInt(darken) : 7
  type = type ? type : "programming"
  heading = decodeURI(heading)
  
  const unsplashResponse = await axios.get(`https://source.unsplash.com/featured/?${type}`)
  const imageBuffer = await axios.get(unsplashResponse.request.res.responseUrl, { responseType: 'arraybuffer' })
  const image = await sharp(imageBuffer.data)
    .resize({ width, height })
    .composite([{
      input: {
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: darken / 10 }
        }
      }
    },
    {
      input: {
        text: {
          text: `<span foreground="white">${heading}</span>`,
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
  const tempFilePath = path.join(os.tmpdir(), 'output.jpg');
  await fs.promises.writeFile(tempFilePath, image);
  functions.logger.info("Rendered succesfully!", {structuredData: true});
  response.sendFile(tempFilePath);
});
