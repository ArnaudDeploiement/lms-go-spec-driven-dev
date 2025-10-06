package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Module représente une unité pédagogique appartenant à un cours.
type Module struct {
	ent.Schema
}

func (Module) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.UUID("course_id", uuid.UUID{}),
		field.UUID("content_id", uuid.UUID{}).
			Optional().
			Nillable(),
		field.String("title").
			NotEmpty(),
		field.String("module_type").
			NotEmpty(),
		field.Int("position").
			Default(0),
		field.Int("duration_seconds").
			Optional(),
		field.String("status").
			Default("active"),
		field.JSON("data", map[string]any{}).
			Optional().
			Default(map[string]any{}),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

func (Module) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("course", Course.Type).
			Ref("modules").
			Field("course_id").
			Unique().
			Required(),
		edge.To("progress_entries", ModuleProgress.Type),
	}
}

func (Module) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("course_id", "position"),
		index.Fields("course_id", "status"),
	}
}
