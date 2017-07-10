# handlebars-bundle
json generator


## USE

```javascript
var HandlebarsBundle = require('handlebars-bundle');
HandlebarsBundle(options);

```


## OPTIONS

    * {string} src - source path
    * {string} root - root path
    * {string} output - output file path
    * {boolean} watch - watching changes
    * {boolean} ignore_errors - ignore errors


## Change default settings 
```javascript
HandlebarsBundle.EXT = '.hbs';
HandlebarsBundle.BUNDLE_EXT = '.bundle.json';
HandlebarsBundle.timeRebuild = '600';
```

## OUTPUT JSON

```javascript
{"template":{"name":"path/path","content":"html content","mtime":1476356647000},"partials":{}}
```
