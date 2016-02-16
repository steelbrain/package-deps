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
    // replace the example argument 'linter-ruby' with the name of this Atom package
    require('atom-package-deps').install('linter-ruby')
      .then(function() {
        console.log('All dependencies installed, good to go')
      })
  }
}
```

While the package name argument of the `install()` function is optional it is recommended to pass it explicitly since otherwise the lookup of the package name inflicts an overhead of roughly a few milliseconds.

#### API

```js
function install(packageName = null)
```

#### License
This project is licensed under the terms of MIT license, See the license file or contact me for more info.
