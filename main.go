package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
)

//type RingJSON struct {
//	Vertices [][]float64 `json:"vertices"`
//}
type RingJSON [][]float64

type PolygonJSON struct {
	Rings []*RingJSON `json:"rings"`
}

type ItemJSON struct {
	Name    string       `json:"name,omitempty"`
	Polygon *PolygonJSON `json:"polygon,omitempty"`
}

type VizFileJSON struct {
	Name  string     `json:"name"`
	Items []ItemJSON `json:"items"`
}

type GetFilesJSON struct {
	Files []*VizFileJSON `json:"files"`
}

type App struct {
	WatchDir       string
	Upgrader       websocket.Upgrader
	WebSockets     map[int64]*websocket.Conn
	WebSocketsLock sync.Mutex
	NextWSID       int64
}

func check(err error) {
	if err != nil {
		panic(err)
	}
}

/* Example polygon file:
-1024, -1024
5120, -1024
5120, 5120
-1024, 5120

4989, 5120
3664, 5120
3460, 3956
4736, 3726
*/
/*
func (a *App) ReadVizFile(filename string) *PolygonJSON {
	pg := &PolygonJSON{}
	f, err := os.Open(filename)
	check(err)
	defer f.Close()
	scanner := bufio.NewScanner(f)
	ring := &RingJSON{}
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			if len(ring.Vertices) != 0 {
				pg.Rings = append(pg.Rings, ring)
			}
			ring = &RingJSON{}
		} else {
			parts := strings.Split(line, ", ")
			if len(parts) != 2 && len(parts) != 3 {
				panic("Invalid polygon line '" + line + "'")
			}
			vx := make([]float64, len(parts))
			for i := 0; i < len(parts); i++ {
				vx[i], err = strconv.ParseFloat(parts[i], 64)
				if err != nil {
					panic("Invalid floating point number in line '" + line + "'")
				}
			}
			ring.Vertices = append(ring.Vertices, vx)
		}
	}
	if len(ring.Vertices) != 0 {
		pg.Rings = append(pg.Rings, ring)
	}
	return pg
}
*/

func (a *App) HTTPGetItems(w http.ResponseWriter, r *http.Request) {
	resp := a.GetFiles()
	out, _ := json.Marshal(resp)
	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

func (a *App) GetFiles() *GetFilesJSON {
	resp := &GetFilesJSON{}
	resp.Files = []*VizFileJSON{}
	walker := func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		//fmt.Printf("%v %v\n", path, info)
		if info.IsDir() {
			return nil
			// return filepath.SkipDir
		}
		if strings.HasSuffix(path, ".json") && info.Size() != 0 {
			name := path[len(a.WatchDir):]
			if name[0] == '/' {
				name = name[1:]
			}
			name = strings.TrimSuffix(name, ".json")
			jfile := &VizFileJSON{Name: name}
			if file, err := os.Open(path); err != nil {
				return err
			} else {
				if err = json.NewDecoder(file).Decode(jfile); err != nil {
					return err
				}
			}
			resp.Files = append(resp.Files, jfile)
		}
		return nil
	}
	err := filepath.Walk(a.WatchDir, walker)
	if err != nil {
		fmt.Printf("Error walking dir %v: %v\n", a.WatchDir, err)
	}
	return resp
}

func (a *App) WebSocketConnect(w http.ResponseWriter, r *http.Request) {
	c, err := a.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Printf("WS upgrade failed: %v", err)
		return
	}
	defer c.Close()
	id := atomic.AddInt64(&a.NextWSID, 1)
	a.WebSocketsLock.Lock()
	a.WebSockets[id] = c
	a.WebSocketsLock.Unlock()
	for {
		c.ReadMessage()
		break
	}
	a.WebSocketsLock.Lock()
	delete(a.WebSockets, id)
	a.WebSocketsLock.Unlock()
}

func (a *App) PollFilesystem() {
	prev := []byte{}
	for {
		files := a.GetFiles()
		msg, _ := json.Marshal(files)
		if !bytes.Equal(prev, msg) {
			//fmt.Printf("change: %v\n", string(msg))
			//fmt.Printf("Sending change to %v websockets\n", len(a.WebSockets))
			prev = msg
			a.WebSocketsLock.Lock()
			for _, conn := range a.WebSockets {
				conn.WriteMessage(websocket.TextMessage, msg)
			}
			a.WebSocketsLock.Unlock()
		}
		time.Sleep(500 * time.Millisecond)
	}
}

func (a *App) Run() {
	http.HandleFunc("/api/items", a.HTTPGetItems)
	http.HandleFunc("/wsapi/connect", a.WebSocketConnect)
	go a.PollFilesystem()
	listenAddr := ":9999"
	fmt.Printf("Listening on %v\n", listenAddr)
	err := http.ListenAndServe(listenAddr, nil)
	fmt.Printf("ListenAndServe returned: %v\n", err)
}

func main() {
	app := App{}
	if len(os.Args) != 2 {
		fmt.Printf("vizbuzz <directory to watch>\n")
		os.Exit(1)
	}
	app.WatchDir = os.Args[1]
	app.Upgrader = websocket.Upgrader{} // use default options
	app.Upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}
	app.WebSockets = map[int64]*websocket.Conn{}
	app.NextWSID = 1
	fmt.Printf("Watching for .json files in %v\n", app.WatchDir)
	app.Run()
}
