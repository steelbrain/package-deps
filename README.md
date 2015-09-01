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
Because the package installation is async, it provides an API to determine if you should do your thing in your package or wait. When dependencies are not installed, Your package is deactivated by deps installer, then dependencies are installed, and then it's activated again. Here's how a consumer would look
```coffee
module.exports =
  activate: ->
    # Note: `linter-ruby` is the name of the current package
    require('atom-package-deps').install('linter-ruby')
      .then ->
        console.log('All deps are installed, it's good to go')
```

#### License
This project is licensed under the terms of MIT license, See the license file or contact me for more info.
