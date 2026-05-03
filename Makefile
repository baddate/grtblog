.PHONY: preview-isr release admin web server
preview-isr:
	@bash ./scripts/preview-isr.sh

web:
	@cd web && pnpm dev

admin:
	@cd admin && pnpm dev

server:
	@cd server && go run ./cmd/api

release:
ifndef VERSION
	$(error VERSION is required, e.g. make release VERSION=v1.2.3 [PUSH=1])
endif
ifeq ($(PUSH),1)
	@bash ./scripts/release.sh $(VERSION) --push
else
	@bash ./scripts/release.sh $(VERSION)
endif
