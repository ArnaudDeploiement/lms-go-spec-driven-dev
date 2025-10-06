package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// ModuleProgress capture l'état d'un module pour une inscription donnée.
type ModuleProgress struct {
	ent.Schema
}

func (ModuleProgress) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.UUID("enrollment_id", uuid.UUID{}),
		field.UUID("module_id", uuid.UUID{}),
		field.String("status").
			Default("not_started"),
		field.Float32("score").
			Optional(),
		field.Int("attempts").
			Default(0),
		field.Time("started_at").
			Optional().
			Nillable(),
		field.Time("completed_at").
			Optional().
			Nillable(),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

func (ModuleProgress) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("enrollment", Enrollment.Type).
			Ref("progress_entries").
			Field("enrollment_id").
			Unique().
			Required(),
		edge.From("module", Module.Type).
			Ref("progress_entries").
			Field("module_id").
			Unique().
			Required(),
	}
}

func (ModuleProgress) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("enrollment_id", "module_id").
			Unique(),
		index.Fields("module_id", "status"),
	}
}
