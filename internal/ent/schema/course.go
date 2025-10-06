package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Course représente un parcours pédagogique.
type Course struct {
	ent.Schema
}

func (Course) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.UUID("organization_id", uuid.UUID{}),
		field.String("title").
			NotEmpty(),
		field.String("slug").
			NotEmpty(),
		field.String("description").
			Optional(),
		field.String("status").
			Default("draft"),
		field.Int("version").
			Default(1),
		field.JSON("metadata", map[string]any{}).
			Optional().
			Default(map[string]any{}),
		field.Time("published_at").
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

func (Course) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("organization", Organization.Type).
			Ref("courses").
			Field("organization_id").
			Unique().
			Required(),
		edge.To("modules", Module.Type),
	}
}

func (Course) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("organization_id", "slug").Unique(),
		index.Fields("organization_id", "status"),
	}
}
