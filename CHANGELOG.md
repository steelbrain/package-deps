# Changelog

## 3.0.9

*   Bump `atom-package-path` minimum version

## 3.0.8

*   Use `atom-package-path` to determine caller package name

## 3.0.7

*   Simplify the regex used (reduce more than 50% regex steps)

## 3.0.6

*   Supports guessing names of packages outside of main root

## 3.0.5

*   Replace Linux-specific dependency `callsite` with cross-platform
    `sb-callsite`

## 3.0.4

*   Fix a scenario when error would be thrown if package name guessing fails

## 3.0.3

*   Use a more reliable way of guessing parent packages

## 3.0.2

*   A few fixes for windows compatibility

## 3.0.1

*   Workaround atom package activation race condition

## 3.0.0

*   Internal cleanup
*   Make name optional

## 2.1.3

*   Don't enable already installed packages by default

## 2.1.2

*   Fix progress bar for multiple dependencies
*   Invoke apm just one time even for multiple dependenciesx

## 2.1.1

*   Invoke apm with `--production`

## 2.1.0

*   Introduced second parameter to install method

## 2.0.x

*   Made some API breaking changes

## 1.x.x

*   Basic API Introduced
