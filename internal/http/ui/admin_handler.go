package ui

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"lms-go/internal/content"
	"lms-go/internal/course"
	"lms-go/internal/enrollment"
	"lms-go/internal/ent"
	"lms-go/internal/organization"
	"lms-go/internal/user"
)

var defaultUserRoles = []string{"admin", "designer", "tutor", "learner"}

type AdminHandler struct {
	orgService        *organization.Service
	userService       *user.Service
	courseService     *course.Service
	contentService    *content.Service
	enrollmentService *enrollment.Service
}

func NewAdminHandler(orgSvc *organization.Service, userSvc *user.Service, courseSvc *course.Service, contentSvc *content.Service, enrollmentSvc *enrollment.Service) *AdminHandler {
	return &AdminHandler{
		orgService:        orgSvc,
		userService:       userSvc,
		courseService:     courseSvc,
		contentService:    contentSvc,
		enrollmentService: enrollmentSvc,
	}
}

func (h *AdminHandler) Mount(r chi.Router) {
	r.Get("/", h.dashboard)
	r.Post("/organizations", h.createOrganization)
	r.Post("/users", h.createUser)
	r.Post("/courses", h.createCourse)
	r.Post("/modules", h.createModule)
	r.Post("/contents", h.createContent)
}

type adminCourse struct {
	Course          *ent.Course
	Modules         []*ent.Module
	EnrollmentCount int
}

type adminViewModel struct {
	Page          string
	PageTitle     string
	FlashMessage  string
	FlashError    string
	UploadURL     string
	CurrentYear   int
	Organizations []*ent.Organization
	SelectedOrg   uuid.UUID
	Users         []*ent.User
	Courses       []adminCourse
	Contents      []*ent.Content
	ModuleTypes   []string
	UserRoles     []string
}

func (h *AdminHandler) dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	orgs, err := h.orgService.List(ctx, "")
	if err != nil {
		http.Error(w, "unable to list organizations", http.StatusInternalServerError)
		return
	}

	var selected uuid.UUID
	if orgParam := strings.TrimSpace(r.URL.Query().Get("org")); orgParam != "" {
		parsed, err := uuid.Parse(orgParam)
		if err == nil {
			selected = parsed
		}
	}
	if selected == uuid.Nil && len(orgs) > 0 {
		selected = orgs[0].ID
	}

	vm := adminViewModel{
		Page:          "admin",
		PageTitle:     "Administration - LMS Go",
		FlashMessage:  r.URL.Query().Get("msg"),
		FlashError:    r.URL.Query().Get("err"),
		UploadURL:     r.URL.Query().Get("upload_url"),
		Organizations: orgs,
		SelectedOrg:   selected,
		CurrentYear:   time.Now().Year(),
		ModuleTypes:   course.AllowedModuleTypes(),
		UserRoles:     append([]string(nil), defaultUserRoles...),
	}

	if selected != uuid.Nil {
		users, err := h.userService.List(ctx, selected, user.Filter{})
		if err != nil {
			http.Error(w, "unable to list users", http.StatusInternalServerError)
			return
		}
		vm.Users = users

		courses, err := h.courseService.List(ctx, selected, course.CourseFilter{})
		if err != nil {
			http.Error(w, "unable to list courses", http.StatusInternalServerError)
			return
		}
		courseStates := make([]adminCourse, 0, len(courses))
		for _, c := range courses {
			mods, err := h.courseService.ListModules(ctx, selected, c.ID)
			if err != nil {
				http.Error(w, "unable to list modules", http.StatusInternalServerError)
				return
			}
			var enrollmentCount int
			if h.enrollmentService != nil {
				enrollments, err := h.enrollmentService.List(ctx, selected, enrollment.EnrollmentFilter{CourseID: c.ID})
				if err != nil {
					http.Error(w, "unable to list enrollments", http.StatusInternalServerError)
					return
				}
				enrollmentCount = len(enrollments)
			}
			courseStates = append(courseStates, adminCourse{
				Course:          c,
				Modules:         mods,
				EnrollmentCount: enrollmentCount,
			})
		}
		vm.Courses = courseStates

		contents, err := h.contentService.List(ctx, selected)
		if err != nil {
			http.Error(w, "unable to list contents", http.StatusInternalServerError)
			return
		}
		vm.Contents = contents
	}

	if err := adminTemplates.ExecuteTemplate(w, "admin", vm); err != nil {
		http.Error(w, "template rendering error", http.StatusInternalServerError)
	}
}

func (h *AdminHandler) createOrganization(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	name := strings.TrimSpace(r.FormValue("name"))
	slug := strings.TrimSpace(r.FormValue("slug"))
	org, err := h.orgService.Create(r.Context(), organization.CreateInput{Name: name, Slug: slug})
	if err != nil {
		log.Printf("admin: create organization: %v", err)
		h.redirect(w, r, uuid.Nil, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, org.ID, "Organisation créée", "", nil)
}

func (h *AdminHandler) createUser(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	input := user.CreateInput{
		OrganizationID: orgID,
		Email:          strings.TrimSpace(r.FormValue("email")),
		Password:       r.FormValue("password"),
		Role:           strings.TrimSpace(r.FormValue("role")),
	}
	if _, err := h.userService.Create(r.Context(), input); err != nil {
		log.Printf("admin: create user: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, orgID, "Utilisateur créé", "", nil)
}

func (h *AdminHandler) createCourse(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	input := course.CreateCourseInput{
		OrganizationID: orgID,
		Title:          strings.TrimSpace(r.FormValue("title")),
		Slug:           strings.TrimSpace(r.FormValue("slug")),
		Description:    strings.TrimSpace(r.FormValue("description")),
	}
	if _, err := h.courseService.Create(r.Context(), input); err != nil {
		log.Printf("admin: create course: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, orgID, "Cours créé", "", nil)
}

func (h *AdminHandler) createModule(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	courseID, err := uuid.Parse(r.FormValue("course_id"))
	if err != nil {
		h.redirect(w, r, orgID, "", "Cours invalide", nil)
		return
	}
	var contentID *uuid.UUID
	if val := strings.TrimSpace(r.FormValue("content_id")); val != "" {
		parsed, err := uuid.Parse(val)
		if err != nil {
			h.redirect(w, r, orgID, "", "Contenu invalide", nil)
			return
		}
		contentID = &parsed
	}
	duration := 0
	if val := strings.TrimSpace(r.FormValue("duration")); val != "" {
		if d, err := strconv.Atoi(val); err == nil {
			duration = d
		}
	}
	_, err = h.courseService.AddModule(r.Context(), orgID, courseID, course.ModuleInput{
		Title:        strings.TrimSpace(r.FormValue("title")),
		ModuleType:   strings.TrimSpace(r.FormValue("module_type")),
		ContentID:    contentID,
		DurationSecs: duration,
	})
	if err != nil {
		log.Printf("admin: create module: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	h.redirect(w, r, orgID, "Module ajouté", "", nil)
}

func (h *AdminHandler) createContent(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.redirect(w, r, uuid.Nil, "", "formulaire invalide", nil)
		return
	}
	orgID, err := uuid.Parse(r.FormValue("org_id"))
	if err != nil {
		h.redirect(w, r, uuid.Nil, "", "Organisation invalide", nil)
		return
	}
	size := int64(0)
	if val := strings.TrimSpace(r.FormValue("size_bytes")); val != "" {
		parsed, err := strconv.ParseInt(val, 10, 64)
		if err != nil {
			h.redirect(w, r, orgID, "", "Taille invalide", nil)
			return
		}
		size = parsed
	}
	link, err := h.contentService.CreateUpload(r.Context(), content.CreateUploadInput{
		OrganizationID: orgID,
		Name:           strings.TrimSpace(r.FormValue("name")),
		MimeType:       strings.TrimSpace(r.FormValue("mime_type")),
		SizeBytes:      size,
		Metadata:       map[string]any{},
	})
	if err != nil {
		log.Printf("admin: create content: %v", err)
		h.redirect(w, r, orgID, "", friendlyError(err), nil)
		return
	}
	extras := url.Values{}
	extras.Set("upload_url", link.UploadURL)
	h.redirect(w, r, orgID, fmt.Sprintf("Contenu %s prêt à être uploadé", link.Content.Name), "", extras)
}

func (h *AdminHandler) redirect(w http.ResponseWriter, r *http.Request, orgID uuid.UUID, msg string, errMsg string, extras url.Values) {
	q := url.Values{}
	if orgID != uuid.Nil {
		q.Set("org", orgID.String())
	}
	if msg != "" {
		q.Set("msg", msg)
	}
	if errMsg != "" {
		q.Set("err", errMsg)
	}
	for key, values := range extras {
		for _, v := range values {
			q.Add(key, v)
		}
	}
	target := "/admin"
	if encoded := q.Encode(); encoded != "" {
		target = target + "?" + encoded
	}
	http.Redirect(w, r, target, http.StatusSeeOther)
}

func friendlyError(err error) string {
	switch {
	case errors.Is(err, organization.ErrInvalidInput):
		return "Veuillez vérifier les informations de l'organisation."
	case errors.Is(err, organization.ErrSlugAlreadyUsed):
		return "Ce slug est déjà utilisé pour une autre organisation."
	case errors.Is(err, user.ErrInvalidInput):
		return "Les informations utilisateur sont incomplètes ou invalides."
	case errors.Is(err, user.ErrEmailAlreadyUsed):
		return "Cette adresse email est déjà utilisée."
	case errors.Is(err, course.ErrInvalidInput):
		return "Les informations du cours ou du module sont invalides."
	case errors.Is(err, course.ErrSlugTaken):
		return "Ce slug de cours est déjà utilisé."
	case errors.Is(err, content.ErrInvalidInput):
		return "Les informations du contenu sont invalides."
	case errors.Is(err, enrollment.ErrInvalidInput):
		return "Les informations d'inscription sont invalides."
	case errors.Is(err, enrollment.ErrAlreadyEnrolled):
		return "L'utilisateur est déjà inscrit à ce cours."
	default:
		return "Une erreur est survenue. Merci de réessayer."
	}
}
