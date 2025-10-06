package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// Organization définit la structure de base pour les organisations clientes.
type Organization struct {
	ent.Schema
}

// Fields de l'entité Organization.
func (Organization) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.String("name").
			NotEmpty().
			Unique(),
		field.String("slug").
			NotEmpty().
			Unique(),
		field.String("status").
			Default("active").
			NotEmpty(),
		field.JSON("settings", map[string]any{}).
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

// Edges de l'entité Organization.
func (Organization) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("users", User.Type),
		edge.To("contents", Content.Type),
		edge.To("courses", Course.Type),
	}
}
