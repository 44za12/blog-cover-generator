# Blog Cover Generator
Generate blog covers in seconds!

## Steps to follow:
Just make a request to https://blog-cover-generator.web.app/generate with a heading query parameter and get your blog cover!

## Features:
- Returns a file so can be used in the src attribute
- Has an option to persist the image to keep it from producing different images on each request
- Has an intelligent algorithm that picks the best complimentary colors for text and overlay based on dominant color in images
    try using this: https://blog-cover-generator.web.app/generate?type=funky OR https://blog-cover-generator.web.app/generate?type=colorful
## All properties

You can pass the following properties:

- heading [optional, defaults to "Hello World!"] : the heading that you want to put on the cover
- type [optional, defaults to programming] : you can type the category that you are writing the article about it can be business, programming, content, absolutely anything.
- width [optional, defaults to 1200] : the desired width of the cover
- height [optional, defaults to 630] : the desired height of the cover
- darken [optional in the range of 1-10, defaults to 7] : the amount of dark overlay you want to put on the background image
- persist [optional boolean, defaults to false]: passing true to this will always give you the same image

The full fledged URL would look like below:

https://blog-cover-generator.web.app/generate?heading=Hello%20World&darken=3&height=400&width=1000&type=business

It's written in a manner that you can include it directly as an image source in your code!

Have fun.
