# j2ref - jsonpointer alternative that uses JavaScript syntax

This is an alternative to jsonpointer which uses JavaScript syntax.

Instead of:

```
/foo%20bar/quux/12/status
```

it's:

```
$['foo bar'].quux[12].status
```

[It's developed and tested in this Observable Notebook.][observable-notebook]

[![Build Status][build-status-image]][build-status] [![Observable Notebook][observable-notebook-image]][observable-notebook] 

[build-status]: https://travis-ci.com/apicomponents/j2ref
[build-status-image]: https://travis-ci.com/apicomponents/j2ref.svg?branch=master
[observable-notebook-image]: https://img.shields.io/badge/observable-notebook-blue.svg
[observable-notebook]: https://beta.observablehq.com/@benatkin/building-an-npm-module-with-observable
