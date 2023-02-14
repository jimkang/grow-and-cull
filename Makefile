include config.mk

HOMEDIR = $(shell pwd)
rollup = ./node_modules/.bin/rollup

deploy:
	npm version patch && make build && git commit -a -m"Build" && make pushall

pushall: sync
	git push origin main

run:
	$(rollup) -c -w

build:
	$(rollup) -c

sync:
	rsync -a $(HOMEDIR)/samples $(USER)@$(SERVER):/$(APPDIR)/
	scp $(HOMEDIR)/app.css $(USER)@$(SERVER):/$(APPDIR)
	scp $(HOMEDIR)/index.html $(USER)@$(SERVER):/$(APPDIR)
	scp $(HOMEDIR)/index.js $(USER)@$(SERVER):/$(APPDIR)

set-up-server-dir:
	ssh $(USER)@$(SERVER) "mkdir -p $(APPDIR)"

test:
	node -r ts-node/register tests/relationship-tests.js
