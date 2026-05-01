package email

import appEvent "github.com/baddate/sanblog-v2/server/internal/app/event"

type EventField = appEvent.EventField
type EventDescriptor = appEvent.EventDescriptor

func EventCatalog() []EventDescriptor {
	return appEvent.Catalog()
}
