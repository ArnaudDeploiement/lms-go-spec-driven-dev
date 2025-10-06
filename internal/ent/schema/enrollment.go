package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Enrollment représente l'inscription d'un utilisateur à un cours.
type Enrollment struct {
	ent.Schema
}

func (Enrollment) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.UUID("organization_id", uuid.UUID{}),
		field.UUID("course_id", uuid.UUID{}),
		field.UUID("user_id", uuid.UUID{}),
		field.UUID("group_id", uuid.UUID{}).
			Optional().
			Nillable(),
		field.String("status").
			Default("pending"),
		field.Float32("progress").
			Default(0),
		field.Time("started_at").
			Optional().
			Nillable(),
		field.Time("completed_at").
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

func (Enrollment) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("organization", Organization.Type).
			Ref("enrollments").
			Field("organization_id").
			Unique().
			Required(),
		edge.From("course", Course.Type).
			Ref("enrollments").
			Field("course_id").
			Unique().
			Required(),
		edge.From("user", User.Type).
			Ref("enrollments").
			Field("user_id").
			Unique().
			Required(),
		edge.From("group", Group.Type).
			Ref("enrollments").
			Field("group_id").
			Unique(),
		edge.To("progress_entries", ModuleProgress.Type),
	}
}

func (Enrollment) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("organization_id", "course_id", "user_id").
			Unique(),
		index.Fields("organization_id", "status"),
	}
}
