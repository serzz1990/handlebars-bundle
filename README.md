# handlebars-bundle
json generator


## USE

```javascript
var bundle = require('handlebars-bundle');
bundle.build(options);
```

## OPTIONS

* {string} src - source path
* {string} root - root path
* {boolean} watch - watching changes
* {boolean} ignore_errors - ignore errors

## OUTPUT JSON

```javascript
{"template":{"name":"path/path","content":"html content","mtime":1476356647000},"partials":{}}
```