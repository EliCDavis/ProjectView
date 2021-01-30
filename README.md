# Project View

Look at all the files in a github repository represented as a graph.

No authentication means you're limited to 60 requests an hour from github.

Check it out [here](https://elicdavis.github.io/ProjectView/).
![Preview](https://i.imgur.com/H3z0Nvr.png)

## Setup
```
$ npm install
$ gulp client-css
$ gulp build
```

Then host the public folder on a webserver.

## For Dev
```
$ npm install
$ gulp client-css
$ gulp
```

As you make changes to the code gulp will automatically detect them and update the dist.
