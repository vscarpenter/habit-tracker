// CloudFront Function — viewer-request
// Rewrites extensionless paths to .html so S3 can serve
// Next.js static-export pages (e.g. /settings → /settings.html).

// eslint-disable-next-line no-unused-vars
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === "/") {
    request.uri = "/index.html";
  } else if (uri.endsWith("/")) {
    request.uri += "index.html";
  } else if (!uri.split("/").pop().includes(".")) {
    // Path has no file extension — append .html
    request.uri += ".html";
  }

  return request;
}
