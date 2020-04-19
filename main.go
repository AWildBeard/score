package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
)

var (
	port string
)

func init() {
	flag.StringVar(&port, "port", "8080", "Set the port that the server will bind to")
}

type scoreServer struct {
	fsRoot http.Handler
}

func newScoreServer() *scoreServer {
	wd, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	wd += "/www"
	fmt.Printf("Serving directory %v\n", wd)

	return &scoreServer{fsRoot: http.FileServer(http.Dir(wd))}
}

func (ss *scoreServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	 fmt.Printf("%s\n", r.RequestURI)

	 ss.fsRoot.ServeHTTP(w, r)
}

func main() {
	ss := newScoreServer()
	http.Handle("/", ss)

	fmt.Printf("Starting server on port %s...\n", port)
	http.ListenAndServe("127.0.0.1:8080", nil)
}
