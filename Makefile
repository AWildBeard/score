BUILD=go build
LDFLAGS=-X main.buildType=debug
DATE=$(shell date '+%s')
GOARCH=$(shell go env GOARCH)
GOOS=$(shell go env GOOS)
GOARM=
OUT=$(shell pwd)/$(shell basename $(PWD))

# Text coloring & styling
BOLD=\033[1m
UNDERLINE=\033[4m
HEADER=${BOLD}${UNDERLINE}

GREEN=\033[38;5;118m
RED=\033[38;5;196m
GREY=\033[38;5;250m

RESET=\033[m

# Targets
all: build

l: lint
lint:
	@printf "${GREEN}${HEADER}Linting${RESET}\n"
	go vet ./...

f: format
format:
	@printf "${GREEN}${HEADER}Formatting${RESET}\n"
	go fmt ./...

t: test
test:
	@printf "${GREEN}${HEADER}Starting test suite${RESET}\n"
	go test -parallel $(shell nproc) ./...

release:
	$(eval LDFLAGS=-w -s -X main.buildType=release)
	@:

b: build 
build: dirs fonts js css clean
	$(eval LDFLAGS=${LDFLAGS} -X main.buildVersion=${DATE})
	@printf "${GREEN}${HEADER}Compiling for ${GOARCH}-${GOOS} to '${OUT}'${RESET}\n"
	GOARM=${GOARM} GOARCH=${GOARCH} GOOS=${GOOS} ${BUILD} -p $(shell nproc) -ldflags="${LDFLAGS}" -o ${OUT}

dirs: www/ www/css/ www/js/ www/icons/
%/:
	@printf "${GREEN}${HEADER}Creating Source Directories${RESET}\n"
	mkdir -p www/js/
	mkdir -p www/css/
	mkdir -p www/icons/

css: www/css/materialize.css www/css/materialize.min.css

%.css:
	@printf "${GREEN}${HEADER}Extracting materialize css sources${RESET}\n"
	curl -LO https://github.com/Dogfalo/materialize/releases/download/1.0.0/materialize-v1.0.0.zip
	unzip -p materialize-v1.0.0.zip materialize/css/materialize.css >www/css/materialize.css
	unzip -p materialize-v1.0.0.zip materialize/css/materialize.min.css >www/css/materialize.min.css

js: www/js/vue.js www/js/vue.min.js www/js/vue-router.js www/js/vue-router.min.js www/js/chart.js www/js/chart.min.js www/js/materialize.js www/js/materialize.min.js

%.js:
	@printf "${GREEN}${HEADER}Downloading vue javascript sources${RESET}\n"
	curl -Lo www/js/vue.js https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.js
	curl -Lo www/js/vue.min.js  https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js
	curl -Lo www/js/vue-router.js https://cdn.jsdelivr.net/npm/vue-router@3.1.6/dist/vue-router.js
	curl -Lo www/js/vue-router.min.js https://cdn.jsdelivr.net/npm/vue-router@3.1.6/dist/vue-router.min.js

	@printf "${GREEN}${HEADER}Downloading Chart javascript sources${RESET}\n"
	curl -Lo www/js/chart.js https://cdn.jsdelivr.net/npm/chart.js@2.9.3/dist/Chart.js
	curl -Lo www/js/chart.min.js https://cdn.jsdelivr.net/npm/chart.js@2.9.3/dist/Chart.min.css

	@printf "${GREEN}${HEADER}Downloading materialize javascript sources${RESET}\n"
	curl -LO https://github.com/Dogfalo/materialize/releases/download/1.0.0/materialize-v1.0.0.zip
	unzip -p materialize-v1.0.0.zip materialize/js/materialize.js >www/js/materialize.js
	unzip -p materialize-v1.0.0.zip materialize/js/materialize.min.js >www/js/materialize.min.js

fonts: www/icons/materialicons.ttf www/icons/materialicons.woff www/icons/materialicons.woff2
	@:

www/icons/materialicons.ttf:
	@printf "${GREEN}${HEADER}Fetching materialicons.ttf dependency${RESET}\n"
	curl -Lo www/icons/materialicons.ttf https://github.com/google/material-design-icons/blob/master/iconfont/MaterialIcons-Regular.ttf?raw=true

www/icons/materialicons.woff:
	@printf "${GREEN}${HEADER}Fetching materialicons.woff dependency${RESET}\n"
	curl -Lo www/icons/materialicons.woff https://github.com/google/material-design-icons/blob/master/iconfont/MaterialIcons-Regular.woff?raw=true

www/icons/materialicons.woff2:
	@printf "${GREEN}${HEADER}Fetching materialicons.woff2 dependency${RESET}\n"
	curl -Lo www/icons/materialicons.woff2 https://github.com/google/material-design-icons/blob/master/iconfont/MaterialIcons-Regular.woff2?raw=true

clean:
	@printf "${GREEN}${HEADER}Cleaning previous build${RESET}\n"
	rm -rf ${OUT}
	rm -rf materialize-v1.0.0.zip

# OS presets
darwin:
	$(eval GOOS=darwin)
	@:
dragonfly:
	$(eval GOOS=dragonfly)
	@:
freebsd:
	$(eval GOOS=freebsd)
	@:
linux:
	$(eval GOOS=linux)
	@:
nacl:
	$(eval GOOS=nacl)
	@:
netbsd:
	$(eval GOOS=netbsd)
	@:
openbsd:
	$(eval GOOS=openbsd)
	@:
plan9:
	$(eval GOOS=plan9)
	@:
solaris:
	$(eval GOOS=solaris)
	@:
windows:
	$(eval GOOS=windows)
	@:

# Architectures
ppc64:
	$(eval GOARCH=ppc64)
	@:
ppc64le:
	$(eval GOARCH=ppc64le)
	@:
mips:
	$(eval GOARCH=mips)
	@:
mipsle:
	$(eval GOARCH=mipsle)
	@:
mips64:
	$(eval GOARCH=mips64)
	@:
mips64le:
	$(eval GOARCH=mips64le)
	@:
386:
	$(eval GOARCH=386)
	@:
amd64:
	$(eval GOARCH=amd64)
	@:
amd64p32:
	$(eval GOARCH=amd64p32)
	@:
arm:
	$(eval GOARCH=arm)
	@:
7:
	$(eval GOARM=7)
	@:
6:
	$(eval GOARM=6)
	@:
5:
	$(eval GOARM=5)
	@:
arm64:
	$(eval GOARCH=arm64)
	@:
s390x:
	$(eval GOARCH=s390x)
	@:
