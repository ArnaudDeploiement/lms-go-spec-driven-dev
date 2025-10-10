package ui

import (
	"embed"
	"html/template"
	"io/fs"
	"net/http"
	"strings"
	"time"
)

//go:embed templates/*.tmpl static/*.css
var uiFS embed.FS

var templateFuncs = template.FuncMap{
	"contains": strings.Contains,
	"div": func(a, b int64) int64 {
		if b == 0 {
			return 0
		}
		return a / b
	},
}

var (
	adminTemplates      = template.Must(template.New("admin").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/admin.tmpl"))
	coursesTemplates    = template.Must(template.New("admin-courses").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/admin_courses.tmpl"))
	contentsTemplates   = template.Must(template.New("admin-contents").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/admin_contents.tmpl"))
	wizardTemplates     = template.Must(template.New("admin-course-wizard").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/admin_course_wizard.tmpl"))
	contentsV2Templates = template.Must(template.New("admin-contents-v2").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/admin_contents_v2.tmpl"))
	homeTemplates       = template.Must(template.New("home").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/home.tmpl"))
	learnerCatalogTmpl  = template.Must(template.New("learn-catalog").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/learn_catalog.tmpl"))
	learnerCourseTmpl   = template.Must(template.New("learn-course").Funcs(templateFuncs).ParseFS(uiFS, "templates/layout.tmpl", "templates/learn_course.tmpl"))
	staticFS            = mustSubFS(uiFS, "static")
)

func mustSubFS(fsys embed.FS, path string) fs.FS {
	sub, err := fs.Sub(fsys, path)
	if err != nil {
		panic(err)
	}
	return sub
}

// StaticHandler sert les fichiers statiques (CSS compilé) embarqués.
func StaticHandler() http.Handler {
	return http.FileServer(http.FS(staticFS))
}

// HomeHandler renvoie la page d'accueil HTML (sans JavaScript) avec Tailwind précompilé.
func HomeHandler() http.HandlerFunc {
	type highlight struct {
		Title       string
		Value       string
		Description string
	}
	type shortcut struct {
		Title       string
		Description string
		ActionLabel string
	}
	type viewModel struct {
		Page         string
		PageTitle    string
		FlashMessage string
		FlashError   string
		CurrentYear  int
		Highlights   []highlight
		Shortcuts    []shortcut
	}

	data := viewModel{
		Page:        "home",
		PageTitle:   "LMS Go",
		CurrentYear: time.Now().Year(),
		Highlights: []highlight{
			{Title: "Cours actifs", Value: "6", Description: "Parcours publiés et accessibles aux apprenants."},
			{Title: "Utilisateurs", Value: "128", Description: "Apprenants, concepteurs et tuteurs actifs."},
			{Title: "Taux de complétion", Value: "82%", Description: "Moyenne globale des parcours suivis."},
		},
		Shortcuts: []shortcut{
			{
				Title:       "Créer un parcours",
				Description: "Assemblez modules e-learning, PDF, vidéos et évaluations.",
				ActionLabel: "Démarrer un parcours",
			},
			{
				Title:       "Inviter une équipe",
				Description: "Ajoutez des apprenants, attribuez les rôles et groupes.",
				ActionLabel: "Gérer les utilisateurs",
			},
			{
				Title:       "Suivre les progrès",
				Description: "Visualisez la complétion, le score moyen et le temps passé.",
				ActionLabel: "Ouvrir les rapports",
			},
			{
				Title:       "Configurer les intégrations",
				Description: "Connectez stockage, webhooks et notifications.",
				ActionLabel: "Voir les intégrations",
			},
		},
	}

	return func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := homeTemplates.ExecuteTemplate(w, "home", data); err != nil {
			http.Error(w, "template rendering error", http.StatusInternalServerError)
		}
	}
}
