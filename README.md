Atom-Package-Deps
===========
Atom-Package-Deps is a module that lets your atom package depend on other atom packages, It's quite simple and shows a nice progress bar as a notification as the packages are installed.

#### How it works?

You need to have an array of package deps in your package manifest, like

```js
{
  "name": "linter-ruby",
  ...
  "package-deps": ["linter"]
}
```

Because the package installation is async, it returns a promise that resolves when all the dependencies have been installed.

```js
'use babel'

module.exports = {
  activate() {
    require('atom-package-deps').install()
      .then(function() {
        console.log('All dependencies installed, good to go')
      })
  }
}
```

#### API

```js
function install(packageName = null, enablePackages = false)
```

#### License
This project is licensed under the terms of MIT license, See the license file or contact me for more info.
