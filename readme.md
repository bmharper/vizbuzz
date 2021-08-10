# VizBuzz
VizBuzz is a browser app that I built for visualizing graphics programming.

I often find times when I'm working on some kind of geometry in code (a set of points, polygons, etc),
and I want to visualize the state of the geometry at some particular point in time. I usually
end up building a throw-away tool for the job, but after building and throwing many of these away,
I decided to build something reusable. Hence VizBuzz was born.

## How it works
VizBuzz works by monitoring a directory on your filesystem. Whenever the files in that directory
change, it notifies the web app, which then reloads all of the content to be visualized.

The files are JSON with a particular format. For example, this will show a rotated square:

```json
{
	"items": [ { "polygon": { "rings": [[[1,0],[0,1],[-1,0],[0,-1]]] } } ]
}
```

You can generate the JSON yourself, or you can use the helper libraries.

This example uses the C++ helper library (which is a header-only single file library):

```cpp
vizbuzz::File file;
double        vertices[] = {4, 0, 3, 1, 2, 0}; // Pairs of XY which form a triangle
file.Add(vizbuzz::Polygon::XY(3, vertices));
file.Save("example-data/demo-cpp.json");
```

## How to run
> go run main.go [directory to watch]

In another terminal,
> cd www  
> npm install [if running for the first time]  
> npm run serve

Point your browser at http://localhost:8080

