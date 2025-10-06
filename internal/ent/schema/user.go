package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// User définit les comptes applicatifs.
type User struct {
	ent.Schema
}

// Fields de User.
func (User) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			Immutable(),
		field.UUID("organization_id", uuid.UUID{}),
		field.String("email").
			NotEmpty().
			Sensitive(),
		field.String("password_hash").
			NotEmpty().
			Sensitive(),
		field.String("role").
			Default("learner"),
		field.String("status").
			Default("active"),
		field.String("refresh_token_id").
			Optional().
			Nillable().
			Sensitive(),
		field.Time("last_login_at").
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

// Indexes définit les index spécifiques au modèle user.
func (User) Indexes() []ent.Index {
	return []ent.Index{
		// Email unique par organisation.
		index.Fields("organization_id", "email").
			Unique(),
	}
}

// Edges de User.
func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("organization", Organization.Type).
			Ref("users").
			Field("organization_id").
			Unique().
			Required(),
	}
}
