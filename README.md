# Citizens Empowered's Custom Scripts

Since citizensempowered.org is hosted on Squarespace, any custom behavior has to be done through front-end HTML and JavaScript. Those files are hosted in this repository, and manually copy-pasted into the site where necessary. The javascript is "hosted" from GitHub using [RawGit](https://rawgit.com/) as a CDN.

## Folders

### helpers
Supporting scripts, such as a converter for taking a html form supplied by Insightly and making it suitable for use on Squarespace, with the correct formatting, classes and styling.

### html-elements
The copy-paste elements for various functions throughout the site. Each of these should be pasted into their own `<code>` element on any given Squarespace page.

### html-header-codes
The HTML code to be pasted into the headers of the various pages of the site, to achieve different functions.

### insightly-proxy
The code for the proxy server, proxying requests for the Insightly API while injecting the proper authentication credentials.

### js
JavaScript files for custom behavior of the site. This is where most of the magic happens.

### mock-up-testing
This is a 'sandbox' folder for trying out new features before deploying them live to the actual site.