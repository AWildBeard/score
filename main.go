package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	port  string
	teams []string = []string{
		"148.88.1.0/24", "148.88.2.0/24", "148.88.3.0/24",
		"148.88.4.0/24", "148.88.5.0/24", "148.88.6.0/24",
		"148.88.7.0/24", "148.88.8.0/24", "148.88.9.0/24",
		"148.88.10.0/24", "148.88.11.0/24", "148.88.12.0/24",
	}

	scanTeamsAsync bool
	scanHostsAsync bool
)

const (
	TEAMS_UPDATE      = "teams update"
	SCOREBOARD_UPDATE = "scoreboard update"
	TEAM_PAGE_UPDATE  = "hosts update"
)

func init() {
	flag.StringVar(&port, "port", "8080", "Set the port that the server will bind to")
}

type Message struct {
	Type    string
	Content interface{}
}

type ScoreboardUpdate struct {
	Time  time.Time
	Teams []ScoreboardTeamUpdate
}

type ScoreboardTeamUpdate struct {
	Team     string
	Services int
}

type TeamPageUpdate struct {
	Team  string
	Hosts map[string]HostUpdate
}

type HostUpdate struct {
	RequiredPorts []int
	OpenPorts     []int
}

type WebSocket struct {
	con  *websocket.Conn
	lock sync.Mutex
}

func (ws *WebSocket) sendMsg(msg interface{}) {
	ws.lock.Lock()
	ws.con.WriteJSON(msg)
	ws.lock.Unlock()
}

type scoreServer struct {
	fsRoot http.Handler

	wsUpgrader websocket.Upgrader

	webSockets     []WebSocket
	webSocketsLock sync.RWMutex

	currentScoreboard []ScoreboardUpdate
	scoreboardLock    sync.RWMutex

	currentTeamPages map[string]TeamPageUpdate
	teamPagesLock    sync.RWMutex

	ScanHostsAsync bool
}

func newScoreServer() (newSS *scoreServer) {
	wd, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	wd += "/www"
	fmt.Printf("Serving directory %v\n", wd)

	newSS = &scoreServer{
		fsRoot: http.FileServer(http.Dir(wd)),
		wsUpgrader: websocket.Upgrader{
			ReadBufferSize:   1024,
			WriteBufferSize:  1024,
			HandshakeTimeout: 3 * time.Second,
		},
		webSockets:        make([]WebSocket, 0),
		currentScoreboard: make([]ScoreboardUpdate, 0),
		currentTeamPages:  map[string]TeamPageUpdate{},
	}

	return
}

func (ss *scoreServer) getTeams() []string {
	return teams
}

func (ss *scoreServer) getCurrentScoreboard() (update []ScoreboardUpdate) {
	ss.scoreboardLock.RLock()
	update = make([]ScoreboardUpdate, len(ss.currentScoreboard))
	copy(update, ss.currentScoreboard)
	ss.scoreboardLock.RUnlock()

	return
}

func (ss *scoreServer) updateScoreboard(update *ScoreboardTeamUpdate) {
	ss.scoreboardLock.Lock()

	// Safe because the scoreboard initializes all hosts as up before scanning
	lastUpdate := ss.currentScoreboard[len(ss.currentScoreboard)-1]

	newTeams := make([]ScoreboardTeamUpdate, len(lastUpdate.Teams))
	newTeams[0] = *update
	newTeamsCounter := 1

	for index := range lastUpdate.Teams {
		team := &lastUpdate.Teams[index]

		if team.Team != update.Team {
			newTeams[newTeamsCounter] = *team
			newTeamsCounter++
		}
	}

	scoreboardUpdate := ScoreboardUpdate{
		Time: time.Now(),
		Teams: newTeams,
	}

	ss.currentScoreboard = append(ss.currentScoreboard, scoreboardUpdate)

	ss.scoreboardLock.Unlock()

	msg := Message{
		Type:    SCOREBOARD_UPDATE,
		Content: scoreboardUpdate,
	}

	ss.webSocketsLock.RLock()
	for index := len(ss.webSockets) - 1; index >= 0; index-- {
		go ss.webSockets[index].sendMsg(&msg)
	}
	ss.webSocketsLock.RUnlock()
}

func (ss *scoreServer) getCurrentTeamPages() (updates []TeamPageUpdate) {
	index := 0

	ss.teamPagesLock.RLock()
	updates = make([]TeamPageUpdate, len(ss.currentTeamPages))
	for _, value := range ss.currentTeamPages {
		updates[index] = value
		index++
	}
	ss.teamPagesLock.RUnlock()

	return
}

func (ss *scoreServer) updateTeamPage(update *TeamPageUpdate) {
	go func(update *TeamPageUpdate) {
		ss.teamPagesLock.Lock()
		ss.currentTeamPages[update.Team] = *update
		ss.teamPagesLock.Unlock()
	}(update)

	msg := Message{
		Type:    TEAM_PAGE_UPDATE,
		Content: update,
	}

	ss.webSocketsLock.RLock()
	for index := range ss.webSockets {
		go ss.webSockets[index].sendMsg(&msg)
	}
	ss.webSocketsLock.RUnlock()
}

func (ss *scoreServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if websocket.IsWebSocketUpgrade(r) {
		con, err := ss.wsUpgrader.Upgrade(w, r, nil)
		if err != nil {
			panic(err)
		}
		ss.handleNewWS(con)

		return
	}

	ss.fsRoot.ServeHTTP(w, r)
}

func (ss *scoreServer) handleNewWS(newCon *websocket.Conn) {
	msg := Message{
		Type:    TEAMS_UPDATE,
		Content: ss.getTeams(),
	}
	newCon.WriteJSON(&msg)

	msg.Type = TEAM_PAGE_UPDATE
	for _, update := range ss.getCurrentTeamPages() {
		msg.Content = update
		newCon.WriteJSON(&msg)
	}

	msg.Type = SCOREBOARD_UPDATE
	for _, update := range ss.getCurrentScoreboard() {
		msg.Content = update
		newCon.WriteJSON(&msg)
	}

	ss.webSocketsLock.Lock()
	ss.webSockets = append(ss.webSockets, WebSocket{con: newCon})
	ss.webSocketsLock.Unlock()
}

/*
func (ss *scoreServer) handleNewWS() {
	for {
		select {
		case newCon := <-ss.newWSChan:

			for i := 0; i < 10; i++ {
				update := ScoreboardUpdate{
					Time:  time.Now(),
					Teams: make([]TeamUpdate, 0),
				}
				for _, team := range teams {
					update.Teams = append(update.Teams, TeamUpdate{
						Team:     team,
						Services: 10,
					})
				}
				time.Sleep(1 * time.Second)
				msg = Message{
					Type:    "scoreboard update",
					Content: update,
				}

				newCon.WriteJSON(&msg)
			}

			for _, team := range teams {
				update := TeamHostsUpdate{
					Team: team,
					Hosts: map[string]HostUpdate{},
				}

				for i := 0 ; i < 10 ; i++ {
					update.Hosts[fmt.Sprintf("148.88.7.%d", i)] = HostUpdate {
						RequiredPorts: []int{22, 53, 80, 443, 3389, 8080},
						OpenPorts: []int{22, 80, 3389},
					}
				}

				msg = Message {
					Type: "hosts update",
					Content: update,
				}

				newCon.WriteJSON(&msg)
			}

			for _, val := range []int{22, 80, 443, 53, 3389, 8080} {
				time.Sleep(3 * time.Second)
				for _, team := range teams {
					update := TeamHostsUpdate{
						Team: team,
						Hosts: map[string]HostUpdate{},
					}

					for i := 0 ; i < 10 ; i++ {
						update.Hosts[fmt.Sprintf("148.88.7.%d", i)] = HostUpdate {
							RequiredPorts: []int{22, 53, 80, 443, 3389, 8080},
							OpenPorts: []int{val},
						}
					}

					msg = Message {
						Type: "hosts update",
						Content: update,
					}

					newCon.WriteJSON(&msg)
				}
			}

			time.Sleep(5 * time.Second)
			newCon.Close()
		}
	}
}
*/

func main() {
	ss := newScoreServer()
	http.Handle("/", ss)

	fmt.Printf("Starting server on port %s...\n", port)
	http.ListenAndServe("127.0.0.1:8080", nil)
}
