const Crawler = require("simplecrawler");
const pa11y = require('pa11y');

//Get Args
const inputArgs = process.argv;

//Args
//URL (required)
//Method
// crawl (default)
// test
//Output
//cli (default)
//json

const args = [];


args['url'] = false;
args['method'] = 'crawl';
args['output'] = 'cli';

//Regex Test and Iterator to parse args
let re = new RegExp('--(.*?=)(.*)');
inputArgs.forEach((arg, i) => {
  if (arg) {
    let match = re.exec(arg);
    if (match) {
      args[match[1].slice(0,-1)] = match[2];
    }
  }
});

//Check to see if the URL is provided and, if so, is valid
let valid = false
if (!args['url']) {
  console.log("Please Provide a URL")
  return false;
}
else {

  valid = isValidHttpUrl(args['url']);
}

if (valid==false) {
  console.log("Please Provide a URL starting with HTTP/S")
  return false;
}


//Let's Do It!
if (args['method'] == 'crawl') {
  let results = crawl(args);
}

else if (args['method'] == 'test') {
  let response = beAPal(args['url'],args);
}

//Test URL For Validity
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  }
  catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

async function crawl(args) {
    let issues = {};

  const crawler = new Crawler(args['url']);
  //Set Crawler Settings
  crawler.interval                 = 50;
  crawler.maxConcurrency           = 5;
  crawler.userAgent                = 'liip/a11ym';
  crawler.timeout                  = 10 * 1000;
  crawler.filterByDomain           = true;
  crawler.allowInitialDomainChange = false;
  crawler.scanSubdomains           = true;
  crawler.stripQuerystring         = true
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


  // Ignore resources that we don't care about
  crawler.addFetchCondition(function(parsedURL) {
    let url = parsedURL.uriPath,
    i, ignore = ['css', 'js','jpg', 'jpeg', 'png', 'xml', 'php', 'ico', 'gif', 'bmp','pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip'];

    for (i = 0; i < ignore.length; i += 1) {
      if (url.indexOf(ignore[i], url.length - ignore[i].length) !== -1) { return false }
    }
    return true;
  });

  crawler.addFetchCondition(function(parsedURL) {
    let url = parsedURL.uriPath;
    const expression = /(.*wp-.*)/g;
    if (url.match(expression)) {
      return false;
    }
    else {
      return true;
    }

  });
  crawler.on("fetchcomplete", async function(queueItem, responseBuffer, response) {
    let url = queueItem.url;
    let pal = await beAPal(url,args);
    if (args['output'] == 'json') {
      issues['url'] = pal;

    }
    //console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
    //console.log("It was a resource of type %s", response.headers['content-type']);
  });
  crawler.start();
  if (args['output'] == 'json') {
    return issues;
    console.log(issues)
  }
}


async function beAPal(url,args) {

  try {
    const results = await pa11y(url);

    return results;
  } catch (error) {
    // Handle the error
  }
}
