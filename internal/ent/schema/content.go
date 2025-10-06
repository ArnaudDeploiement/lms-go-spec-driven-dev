package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Content représente un objet média stocké (S3/MinIO).
type Content struct {
	ent.Schema
}

func (Content) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.UUID("organization_id", uuid.UUID{}),
		field.String("name").
			NotEmpty(),
		field.String("mime_type").
			NotEmpty(),
		field.Int64("size_bytes").
			Optional(),
		field.String("storage_key").
			NotEmpty(),
		field.String("status").
			Default("pending"),
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

func (Content) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("organization", Organization.Type).
			Ref("contents").
			Field("organization_id").
			Unique().
			Required(),
	}
}

func (Content) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("organization_id", "storage_key").
			Unique(),
		index.Fields("organization_id", "name"),
	}
}
