package main

import (
	/*
	"bytes"
	"fmt"
	"io"
	"net"
	"os/exec"
	"regexp"
	"strings"
	"syscall"
	*/
	"time"
)

type MonitoredHost struct {
	MonitorType string
	Ip string
	Ports []int
	Command string
	Response string
}

type Team struct {
	Team string
	Hosts []MonitoredHost
}

func (ss *scoreServer) scanTeam(team *Team) {
	stu := ScoreboardTeamUpdate{}
	stu.Team = team.Team

	tpu := TeamPageUpdate{}
	tpu.Hosts = map[string]HostUpdate{}
	tpu.Team = team.Team

	for _, host := range team.Hosts {
		tpu.Hosts[host.Ip] = host.scan(3 * time.Second, false)
	}

	ss.updateScoreboard(&stu)
	ss.updateTeamPage(&tpu)
}

func (host *MonitoredHost) scan(portTimeout time.Duration, async bool, output ...chan HostUpdate) (results HostUpdate) {
	results = HostUpdate{
		RequiredPorts: host.Ports, 
		OpenPorts: make([]int, 0),
	}

	// Do teh scanning stuffs

	if async {
		for _, ch := range output {
			ch <- results
		}
	}
	return results
}
	/*
	serviceUp := false

	if service.Protocol == "host-command" {
		var (
			command      = strings.Split(service.Command, " ")
			regexToMatch = fmt.Sprint(service.Response)
			sig          = make(chan bool, 1)
			cmd          *exec.Cmd
			stdout       = bytes.Buffer{}
			stderr       = bytes.Buffer{}
		)

		if len(command) > 1 {
			cmd = exec.Command(command[0], command[1:]...)
		} else {
			cmd = exec.Command(command[0])
		}

		cmd.Stdout = &stdout
		cmd.Stderr = &stderr

		cmd.Start()

		time.AfterFunc(timeout, func() {
			select {
			case <-sig:
				return
			default:
				if cmd.Process != nil {
					syscall.Kill(cmd.Process.Pid, syscall.SIGKILL)
				}
			}
		})

		cmd.Wait()
		sig <- true

		foundInStdout, _ := regexp.Match(regexToMatch, stdout.Bytes())
		foundInStderr, _ := regexp.Match(regexToMatch, stderr.Bytes())

		serviceUp = foundInStdout || foundInStderr
	} else {
		if conn, err := net.DialTimeout(service.Protocol,
			fmt.Sprintf("%v:%v", ip, service.Port), timeout); err == nil {

			stringToSend := fmt.Sprint(service.Command)
			regexToMatch := fmt.Sprint(service.Response)

			conn.SetDeadline(time.Now().Add(timeout))

			if len(stringToSend) > 0 {
				io.Copy(conn, strings.NewReader(stringToSend)) // Write what we need to write.
			}

			// No sense of even bothering to read the response if we aren't
			// going to do anything with it.
			if len(regexToMatch) > 0 {
				buffer := bytes.Buffer{}
				io.Copy(&buffer, conn) // Read the response
				serviceUp, _ = regexp.Match(regexToMatch, buffer.Bytes())
			} else {
				serviceUp = true
			}

			conn.Close()
		}
	}

	// Write the service update
	updateChannel <- ServiceUpdate{
		ip,
		true,
		serviceUp,
		service.Name,
	}
}
*/