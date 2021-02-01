const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
  app.use(createProxyMiddleware('/api',
    {
      "target": "https://assets.mevo.co.nz/vehicles",
      "changeOrigin": true,
      "pathRewrite": {
        "^/api": "/"
      }
    }));
  app.use(createProxyMiddleware('/apc',
    {
      "target": "https://api.mevo.co.nz/v1/vehicles",
      "changeOrigin": true,
      "pathRewrite": {
        "^/apc": "/"
      }
    }))
}