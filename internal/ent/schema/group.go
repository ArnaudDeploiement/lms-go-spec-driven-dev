package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Group représente un groupe d'apprenants au sein d'une organisation.
type Group struct {
	ent.Schema
}

func (Group) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.UUID("organization_id", uuid.UUID{}),
		field.UUID("course_id", uuid.UUID{}).
			Optional().
			Nillable(),
		field.String("name").
			NotEmpty(),
		field.String("description").
			Optional(),
		field.Int("capacity").
			Optional().
			Nillable(),
		field.JSON("metadata", map[string]any{}).
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

func (Group) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("organization", Organization.Type).
			Ref("groups").
			Field("organization_id").
			Unique().
			Required(),
		edge.From("course", Course.Type).
			Ref("groups").
			Field("course_id").
			Unique(),
		edge.To("enrollments", Enrollment.Type),
	}
}

func (Group) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("organization_id", "name"),
		index.Fields("organization_id", "course_id"),
	}
}
